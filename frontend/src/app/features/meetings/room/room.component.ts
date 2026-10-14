import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, lastValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MeetingsStore } from '../store/meetings.store';
import { CourseService } from '@core/services/course.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import {
  MeetingTitleDialogComponent,
} from '../meeting-title-dialog/meeting-title-dialog.component';
import {
  MessagingSocketService,
  MeetingAnswerPayload,
  MeetingChatPayload,
  MeetingIcePayload,
  MeetingOfferPayload,
  MeetingParticipantInfo,
  MeetingParticipantJoinedPayload,
  MeetingParticipantLeftPayload,
} from '@features/messaging/services/messaging-socket.service';
import { SocketErrorPayload } from '@features/messaging/models/messaging.model';

/**
 * STUN público para peer-to-peer dentro de la misma red (LAN/aula — Spec O2).
 * TURN no está provisionado: fuera de la misma red o con NAT estricto los peers
 * no logran conexión directa (limitación documentada en la UI).
 */
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

interface ChatMessage {
  userId: string;
  content: string;
  sentAt: string;
  own: boolean;
}

interface RemotePeer {
  userId: string;
  socketId: string;
  stream: MediaStream | null;
}

interface PeerEntry {
  pc: RTCPeerConnection;
  socketId: string;
  /** true mientras hay un createOffer en vuelo (evita dobles ofertas/glare). */
  negotiating: boolean;
}

/**
 * Sala de reuniones con media (Spec O2 — WebRTC mesh).
 *
 * - Check-in AUTOMÁTICO vía REST (`store.checkIn`) + `meeting:join` por socket
 *   (el gateway revalida `assertCanEnterRoom` y reutiliza la sesión abierta).
 * - Mesh nativo: un `RTCPeerConnection` por participante; el que entra inicia
 *   las ofertas (`meeting:offer`) y los demás responden (`meeting:answer`);
 *   ICE viaja por `meeting:ice`; leave/disconnect cierran peers y tracks.
 * - Reconexión manual (socket `reconnection:false`): al reconectar se re-emite
 *   `meeting:join` y se re-negocia el mesh desde cero (Spec O2 esc.5).
 * - Cámara denegada: se reintenta solo audio; si también falla, modo chat.
 * - Chat efímero de la sala vía `meeting:chat` (sin persistencia).
 */
@Component({
  selector: 'app-room',
  standalone: false,
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
})
export class RoomComponent implements OnInit, AfterViewInit, OnDestroy {
  courseId = '';
  courseName = '';
  loadingCourse = true;

  // Media
  readonly micEnabled = signal(false);
  readonly camEnabled = signal(false);
  readonly audioOnly = signal(false);
  readonly mediaDenied = signal(false);

  // Sala
  readonly joined = signal(false);
  readonly meetingError = signal<string | null>(null);
  readonly remotePeers = signal<RemotePeer[]>([]);

  // Chat
  readonly chatOpen = signal(true);
  readonly chatDraft = signal('');
  readonly chatMessages = signal<ChatMessage[]>([]);

  @ViewChild('localVideo') private localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('chatScroll') private chatScroll!: ElementRef<HTMLElement>;

  private selfUserId = '';
  private localStream: MediaStream | null = null;
  private peers = new Map<string, PeerEntry>();
  private subs: Subscription[] = [];
  private leftRoom = false;

  constructor(
    readonly store: MeetingsStore,
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private socket: MessagingSocketService,
    private dialog: MatDialog,
  ) {}

  get roomUrl(): string {
    return `${window.location.origin}/meetings/${this.courseId}/room`;
  }

  async ngOnInit(): Promise<void> {
    this.courseId = this.route.snapshot.paramMap.get('courseId') ?? '';
    this.selfUserId = this.authService.getCurrentUser()?._id ?? '';
    await this.loadCourse();
    const title = await this.resolveMeetingTitle();
    await this.store.checkIn(this.courseId, title);
    if (this.store.error()) {
      return; // 403 REST: sin acceso, no se une al signaling
    }
    await this.store.refreshParticipants();
    this.store.startPolling();

    this.subscribeSignaling();
    this.subs.push(this.socket.connected.subscribe((connected) => this.onSocketConnected(connected)));

    // El socket es global (app.component lo conecta al loguear). Si ya está
    // conectado, unirse ahora; si conecta después, lo hace el suscriptor.
    if (this.socket.isConnected()) {
      this.joinRoom();
    }
  }

  /**
   * Spec F2 — primer entrante define el título. Si NO hay sesión abierta en el
   * curso (getOpenSessions=0), este usuario sería el primero → mostrar el dialog
   * de título ANTES del check-in. Si ya hay una sesión abierta, los siguientes
   * entran sin título (reuso no-bloqueante, no se sobrescribe).
   */
  private async resolveMeetingTitle(): Promise<string | undefined> {
    const hasOpen = await this.store.hasOpenSessions(this.courseId);
    if (hasOpen) {
      return undefined;
    }
    const dialogRef = this.dialog.open(MeetingTitleDialogComponent, {
      width: '420px',
      maxWidth: '94vw',
      data: { courseName: this.courseName },
    });
    const result = await lastValueFrom(dialogRef.afterClosed());
    return result ?? undefined;
  }

  ngAfterViewInit(): void {
    void this.startMedia();
  }

  ngOnDestroy(): void {
    this.leftRoom = true;
    this.socket.leaveMeeting(); // best-effort; el gateway hace check-out
    this.teardownPeers();
    this.stopLocalTracks();
    this.subs.forEach((s) => s.unsubscribe());
    void this.store.checkOut();
  }

  @HostListener('window:beforeunload')
  @HostListener('window:pagehide')
  onWindowUnload(): void {
    this.store.checkOutOnUnload();
  }

  // ─── Media local ───────────────────────────────────────────────────────────

  private async startMedia(): Promise<void> {
    if (this.leftRoom) {
      return;
    }
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      // Cámara denegada/no disponible: reintentar solo audio (Spec O2 esc.2).
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        this.audioOnly.set(true);
        this.notificationService.warning(
          'Cámara no disponible: te unes a la sala solo con audio y chat.',
        );
      } catch {
        // Sin cámara ni micrófono: modo chat (Spec: la sala continúa con chat).
        this.mediaDenied.set(true);
        this.notificationService.warning(
          'Cámara y micrófono no disponibles: la sala funciona solo con chat.',
        );
        return;
      }
    }

    this.micEnabled.set(this.localStream.getAudioTracks().length > 0);
    this.camEnabled.set(this.localStream.getVideoTracks().length > 0);

    if (this.localVideo) {
      this.localVideo.nativeElement.srcObject = this.localStream;
    }

    // Si algún peer ya existía (media llegó después del join), adjuntar tracks.
    for (const { pc } of this.peers.values()) {
      if (pc.getSenders().length === 0 && this.localStream) {
        for (const track of this.localStream.getTracks()) {
          pc.addTrack(track, this.localStream);
        }
      }
    }
  }

  toggleMic(): void {
    const track = this.localStream?.getAudioTracks()[0];
    if (!track) {
      return;
    }
    track.enabled = !track.enabled;
    this.micEnabled.set(track.enabled);
  }

  toggleCam(): void {
    const track = this.localStream?.getVideoTracks()[0];
    if (!track) {
      return;
    }
    track.enabled = !track.enabled;
    this.camEnabled.set(track.enabled);
  }

  private stopLocalTracks(): void {
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;
  }

  // ─── Signaling / mesh ──────────────────────────────────────────────────────

  private subscribeSignaling(): void {
    this.subs.push(
      this.socket.meetingParticipants.subscribe((payload) => this.onParticipants(payload.participants)),
      this.socket.meetingParticipantJoined.subscribe((payload) => this.onParticipantJoined(payload)),
      this.socket.meetingParticipantLeft.subscribe((payload) => this.onParticipantLeft(payload)),
      this.socket.meetingOffer.subscribe((payload) => void this.onOffer(payload)),
      this.socket.meetingAnswer.subscribe((payload) => void this.onAnswer(payload)),
      this.socket.meetingIce.subscribe((payload) => void this.onIce(payload)),
      this.socket.meetingChat.subscribe((payload) => this.onMeetingChat(payload)),
      this.socket.meetingError.subscribe((payload) => this.onMeetingError(payload)),
    );
  }

  private onSocketConnected(connected: boolean): void {
    if (this.leftRoom || this.store.error() || this.meetingError()) {
      return;
    }
    if (connected) {
      if (this.joined()) {
        // Reconexión (Spec O2 esc.5): tirar el mesh y re-negociar desde cero.
        this.teardownPeers();
      }
      this.joinRoom();
    }
  }

  private joinRoom(): void {
    if (this.leftRoom || this.meetingError()) {
      return;
    }
    this.socket.joinMeeting(this.courseId);
    this.joined.set(true);
  }

  /** El que entra recibe el roster: inicia las ofertas hacia cada participante. */
  private onParticipants(participants: MeetingParticipantInfo[]): void {
    for (const participant of participants) {
      if (participant.userId === this.selfUserId) {
        continue;
      }
      const existing = this.peers.get(participant.userId);
      if (existing) {
        // Reconexión: el socket del peer cambió — actualizar y re-ofertar.
        existing.socketId = participant.socketId;
        this.remotePeers.update((list) =>
          list.map((peer) =>
            peer.userId === participant.userId ? { ...peer, socketId: participant.socketId } : peer,
          ),
        );
        void this.negotiate(participant.userId);
      } else {
        this.createPeer(participant.userId, participant.socketId, true);
      }
    }
  }

  /** Un peer entró a la sala: preparar mi lado del peer (él oferta, yo respondo). */
  private onParticipantJoined(payload: MeetingParticipantJoinedPayload): void {
    if (payload.userId === this.selfUserId) {
      return;
    }
    this.createPeer(payload.userId, payload.socketId, false);
  }

  /** Un peer salió: cerrar su RTCPeerConnection y quitar su tile (Spec O2 esc.3). */
  private onParticipantLeft(payload: MeetingParticipantLeftPayload): void {
    this.closePeer(payload.userId);
  }

  private async onOffer(payload: MeetingOfferPayload): Promise<void> {
    if (payload.fromUserId === this.selfUserId) {
      return;
    }
    const entry = this.ensurePeer(payload.fromUserId, payload.fromSocketId);
    try {
      // Glare: si ambos ofertaron a la vez (p. ej. media tardía en ambos lados),
      // hacer rollback del offer local pendiente antes de aceptar el entrante.
      if (entry.pc.signalingState === 'have-local-offer') {
        await entry.pc.setLocalDescription({ type: 'rollback' });
      }
      await entry.pc.setRemoteDescription(
        new RTCSessionDescription(payload.offer as RTCSessionDescriptionInit),
      );
      const answer = await entry.pc.createAnswer();
      await entry.pc.setLocalDescription(answer);
      this.socket.sendMeetingAnswer(payload.fromSocketId, answer);
    } catch {
      this.closePeer(payload.fromUserId); // oferta inválida: limpiar y esperar nuevo join
    }
  }

  private async onAnswer(payload: MeetingAnswerPayload): Promise<void> {
    if (payload.fromUserId === this.selfUserId) {
      return;
    }
    const entry = this.ensurePeer(payload.fromUserId, payload.fromSocketId);
    try {
      await entry.pc.setRemoteDescription(
        new RTCSessionDescription(payload.answer as RTCSessionDescriptionInit),
      );
    } catch {
      // Descripción inválida (p. ej. tras re-negociación): ignorar.
    }
  }

  private async onIce(payload: MeetingIcePayload): Promise<void> {
    if (payload.fromUserId === this.selfUserId) {
      return;
    }
    const entry = this.ensurePeer(payload.fromUserId, payload.fromSocketId);
    try {
      await entry.pc.addIceCandidate(new RTCIceCandidate(payload.candidate as RTCIceCandidateInit));
    } catch {
      // Candidato obsoleto tras re-negociación: ignorar.
    }
  }

  private createPeer(userId: string, socketId: string, offerer: boolean): void {
    this.closePeer(userId); // idempotente (reconexión: recrear el peer)

    const pc = new RTCPeerConnection(RTC_CONFIG);
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        pc.addTrack(track, this.localStream);
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.sendMeetingIce(socketId, event.candidate.toJSON());
      }
    };
    // Media tardía (getUserMedia resuelve después del join): al agregar tracks
    // el navegador dispara negotiationneeded → re-ofertar para que el remoto
    // reciba el video/audio (Spec O2 esc.1).
    pc.onnegotiationneeded = () => void this.negotiate(userId);
    pc.ontrack = (event) => {
      const stream = event.streams[0] ?? new MediaStream([event.track]);
      this.remotePeers.update((list) =>
        list.map((peer) => (peer.userId === userId ? { ...peer, stream } : peer)),
      );
    };
    pc.onconnectionstatechange = () => {
      // 'failed'/'closed' se dejan pasar: la reconexión o un nuevo join recrea el peer.
      if (pc.connectionState === 'failed' && !this.leftRoom) {
        console.warn(`[room] conexión WebRTC con ${userId} falló (NAT/TURN?)`);
      }
    };

    this.peers.set(userId, { pc, socketId, negotiating: false });
    this.remotePeers.update((list) =>
      list.some((peer) => peer.userId === userId)
        ? list
        : [...list, { userId, socketId, stream: null }],
    );

    if (offerer) {
      void this.negotiate(userId);
    }
  }

  private ensurePeer(userId: string, socketId: string): PeerEntry {
    const existing = this.peers.get(userId);
    if (existing) {
      existing.socketId = socketId;
      this.remotePeers.update((list) =>
        list.map((peer) => (peer.userId === userId ? { ...peer, socketId } : peer)),
      );
      return existing;
    }
    this.createPeer(userId, socketId, false);
    return this.peers.get(userId)!;
  }

  /**
   * Inicia (o re-negocia) el intercambio SDP como oferente. Guardas:
   * - `negotiating`: no lanzar dos createOffer a la vez (media tardía +
   *   negotiationneeded).
   * - `signalingState === 'have-local-offer'`: hay un offer pendiente, el peer
   *   entrante se atiende en `onOffer` (rollback + answer).
   */
  private async negotiate(userId: string): Promise<void> {
    const entry = this.peers.get(userId);
    if (!entry || entry.negotiating) {
      return;
    }
    if (entry.pc.signalingState === 'have-local-offer') {
      return;
    }
    entry.negotiating = true;
    try {
      const offer = await entry.pc.createOffer();
      await entry.pc.setLocalDescription(offer);
      this.socket.sendMeetingOffer(entry.socketId, offer);
    } catch {
      // Negociación transitoria: se reintenta en la próxima negotiationneeded
      // o reconexión.
    } finally {
      entry.negotiating = false;
    }
  }

  private closePeer(userId: string): void {
    const entry = this.peers.get(userId);
    if (!entry) {
      return;
    }
    entry.pc.onicecandidate = null;
    entry.pc.ontrack = null;
    entry.pc.onconnectionstatechange = null;
    try {
      entry.pc.close();
    } catch {
      // Ya cerrado.
    }
    this.peers.delete(userId);
    this.remotePeers.update((list) => list.filter((peer) => peer.userId !== userId));
  }

  private teardownPeers(): void {
    for (const userId of [...this.peers.keys()]) {
      this.closePeer(userId);
    }
  }

  // ─── Chat de la sala ───────────────────────────────────────────────────────

  sendChat(): void {
    const content = this.chatDraft().trim();
    if (!content) {
      return;
    }
    this.socket.sendMeetingChat(content);
    this.appendChat({
      userId: this.selfUserId,
      content,
      sentAt: new Date().toISOString(),
      own: true,
    });
    this.chatDraft.set('');
  }

  onChatDraft(event: Event): void {
    this.chatDraft.set((event.target as HTMLInputElement).value);
  }

  private onMeetingChat(payload: MeetingChatPayload): void {
    this.appendChat({
      userId: payload.userId,
      content: payload.content,
      sentAt: payload.sentAt,
      own: payload.userId === this.selfUserId,
    });
  }

  private appendChat(message: ChatMessage): void {
    this.chatMessages.update((list) => [...list.slice(-199), message]);
    setTimeout(() => {
      const el = this.chatScroll?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }

  // ─── Acciones de sala ──────────────────────────────────────────────────────

  leaveRoom(): void {
    this.leftRoom = true;
    this.socket.leaveMeeting();
    this.teardownPeers();
    this.stopLocalTracks();
    void this.store.checkOut();
    this.router.navigate(['/courses', this.courseId]);
  }

  toggleChat(): void {
    this.chatOpen.update((open) => !open);
  }

  copyLink(): void {
    navigator.clipboard?.writeText(this.roomUrl);
  }

  // ─── Helpers de template ───────────────────────────────────────────────────

  displayNameOf(userId: string): string {
    if (userId === this.selfUserId) {
      return 'Tú';
    }
    const participant = this.store.participants().find((p) => p.userId === userId);
    return participant?.displayName ?? 'Participante';
  }

  peerHasVideo(peer: RemotePeer): boolean {
    return (peer.stream?.getVideoTracks().length ?? 0) > 0;
  }

  formatChatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private async loadCourse(): Promise<void> {
    try {
      const course = await lastValueFrom(this.courseService.getCourseById(this.courseId));
      this.courseName = course.name ?? '';
    } catch {
      this.courseName = '';
    } finally {
      this.loadingCourse = false;
    }
  }

  private onMeetingError(payload: SocketErrorPayload): void {
    if (payload.code === 'FORBIDDEN' || payload.code === 'NOT_FOUND') {
      // Spec O2 esc.4: sin acceso — no se entra a la sala ni a la sesión.
      this.meetingError.set(payload.message);
      this.leftRoom = true;
      this.teardownPeers();
      void this.store.checkOut();
      return;
    }
    this.notificationService.error(payload.message ?? 'Error en la sala');
  }
}