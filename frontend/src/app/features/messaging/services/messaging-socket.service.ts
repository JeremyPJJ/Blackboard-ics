import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { io, Socket } from 'socket.io-client';
import { lastValueFrom, Observable, Subject } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { Message, SocketErrorPayload } from '../models/messaging.model';

/** Payload de `notification:new` emitido por el gateway (Spec O6b). */
export interface NotificationNewPayload {
  type: string;
  conversationId: string;
  senderId: string;
  preview?: string;
  sentAt: string;
}

// ─── Payloads de signaling de la sala (Spec O2 — WebRTC mesh) ───────────────

/** Participante del roster de la sala (respuesta a `meeting:join`). */
export interface MeetingParticipantInfo {
  userId: string;
  socketId: string;
}

export interface MeetingParticipantsPayload {
  participants: MeetingParticipantInfo[];
}

export interface MeetingParticipantJoinedPayload {
  userId: string;
  socketId: string;
}

export interface MeetingParticipantLeftPayload {
  userId: string;
  socketId: string;
}

export interface MeetingOfferPayload {
  fromUserId: string;
  fromSocketId: string;
  offer: unknown;
}

export interface MeetingAnswerPayload {
  fromUserId: string;
  fromSocketId: string;
  answer: unknown;
}

export interface MeetingIcePayload {
  fromUserId: string;
  fromSocketId: string;
  candidate: unknown;
}

export interface MeetingChatPayload {
  userId: string;
  content: string;
  sentAt: string;
}

/**
 * Cliente socket.io del gateway de mensajería.
 *
 * - El token JWT se envía en el handshake (`auth.token`).
 * - Si el servidor rechaza la conexión por token inválido/expirado (evento
 *   `connect_error` o `error` con código `AUTH_FAILED`), se intenta refrescar
 *   el access token; si el refresh falla, se limpia la sesión y se redirige
 *   a `/login` (Spec: expired-JWT scenario).
 * - No usa auto-reconexión de socket.io: la reconexión es manual y siempre
 *   con un token vigente.
 *
 * Nota: se usa `socket.io-client` nativo en lugar de `ngx-socket-io` porque
 * ninguna versión de `ngx-socket-io` es compatible con Angular 19 (4.8.x pide
 * core ^18/common ^19; 4.9+ pide Angular 20; 4.11 pide Angular 22).
 */
@Injectable({
  providedIn: 'root',
})
export class MessagingSocketService {
  private socket: Socket | null = null;
  private refreshing = false;

  private newMessage$ = new Subject<{ message: Message }>();
  private conversationUpdated$ = new Subject<{
    conversationId: string;
    lastReadAt?: string | null;
    lastMessageAt?: string;
    lastMessageContent?: string;
    lastMessageBy?: string;
    userId?: string;
  }>();
  private notification$ = new Subject<NotificationNewPayload>();
  private error$ = new Subject<SocketErrorPayload>();
  private connected$ = new Subject<boolean>();

  // Signaling de la sala (Spec O2)
  private meetingParticipants$ = new Subject<MeetingParticipantsPayload>();
  private meetingParticipantJoined$ = new Subject<MeetingParticipantJoinedPayload>();
  private meetingParticipantLeft$ = new Subject<MeetingParticipantLeftPayload>();
  private meetingOffer$ = new Subject<MeetingOfferPayload>();
  private meetingAnswer$ = new Subject<MeetingAnswerPayload>();
  private meetingIce$ = new Subject<MeetingIcePayload>();
  private meetingChat$ = new Subject<MeetingChatPayload>();
  private meetingError$ = new Subject<SocketErrorPayload>();

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  get newMessage(): Observable<{ message: Message }> {
    return this.newMessage$.asObservable();
  }

  get conversationUpdated(): Observable<{
    conversationId: string;
    lastReadAt?: string | null;
    lastMessageAt?: string;
    lastMessageContent?: string;
    lastMessageBy?: string;
    userId?: string;
  }> {
    return this.conversationUpdated$.asObservable();
  }

  get notification(): Observable<NotificationNewPayload> {
    return this.notification$.asObservable();
  }

  get error(): Observable<SocketErrorPayload> {
    return this.error$.asObservable();
  }

  get connected(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  // ─── Observables de la sala (Spec O2) ──────────────────────────────────────

  get meetingParticipants(): Observable<MeetingParticipantsPayload> {
    return this.meetingParticipants$.asObservable();
  }

  get meetingParticipantJoined(): Observable<MeetingParticipantJoinedPayload> {
    return this.meetingParticipantJoined$.asObservable();
  }

  get meetingParticipantLeft(): Observable<MeetingParticipantLeftPayload> {
    return this.meetingParticipantLeft$.asObservable();
  }

  get meetingOffer(): Observable<MeetingOfferPayload> {
    return this.meetingOffer$.asObservable();
  }

  get meetingAnswer(): Observable<MeetingAnswerPayload> {
    return this.meetingAnswer$.asObservable();
  }

  get meetingIce(): Observable<MeetingIcePayload> {
    return this.meetingIce$.asObservable();
  }

  get meetingChat(): Observable<MeetingChatPayload> {
    return this.meetingChat$.asObservable();
  }

  get meetingError(): Observable<SocketErrorPayload> {
    return this.meetingError$.asObservable();
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  connect(): void {
    if (this.socket?.connected) {
      return;
    }
    this.disconnect();

    const token = localStorage.getItem('accessToken');
    this.socket = io(this.socketUrl(), {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: false,
    });

    this.socket.on('connect', () => this.connected$.next(true));
    this.socket.on('disconnect', () => this.connected$.next(false));
    this.socket.on('newMessage', (payload: { message: Message }) =>
      this.newMessage$.next(payload),
    );
    this.socket.on('conversationUpdated', (payload) => this.conversationUpdated$.next(payload));
    this.socket.on('notification:new', (payload: NotificationNewPayload) =>
      this.notification$.next(payload),
    );
    this.socket.on('error', (payload: SocketErrorPayload) => this.onSocketError(payload));
    this.socket.on('connect_error', () => this.handleAuthFailure());

    // Signaling de la sala (Spec O2)
    this.socket.on('meeting:participants', (payload: MeetingParticipantsPayload) =>
      this.meetingParticipants$.next(payload),
    );
    this.socket.on('meeting:participant-joined', (payload: MeetingParticipantJoinedPayload) =>
      this.meetingParticipantJoined$.next(payload),
    );
    this.socket.on('meeting:participant-left', (payload: MeetingParticipantLeftPayload) =>
      this.meetingParticipantLeft$.next(payload),
    );
    this.socket.on('meeting:offer', (payload: MeetingOfferPayload) => this.meetingOffer$.next(payload));
    this.socket.on('meeting:answer', (payload: MeetingAnswerPayload) =>
      this.meetingAnswer$.next(payload),
    );
    this.socket.on('meeting:ice', (payload: MeetingIcePayload) => this.meetingIce$.next(payload));
    this.socket.on('meeting:chat', (payload: MeetingChatPayload) => this.meetingChat$.next(payload));
    this.socket.on('meeting:error', (payload: SocketErrorPayload) => this.meetingError$.next(payload));
  }

  sendMessage(conversationId: string, content: string): void {
    this.socket?.emit('sendMessage', { conversationId, content });
  }

  markAsRead(conversationId: string): void {
    this.socket?.emit('markAsRead', { conversationId });
  }

  /** Notifica al gateway que el usuario archivó la conversación (sale de la room). */
  archiveConversation(conversationId: string): void {
    this.socket?.emit('archiveConversation', { conversationId });
  }

  /** Notifica al gateway que el usuario desarchivó (re-join a la room conv:{id}). */
  unarchiveConversation(conversationId: string): void {
    this.socket?.emit('unarchiveConversation', { conversationId });
  }

  // ─── Emisores de la sala (Spec O2) ─────────────────────────────────────────

  /** Entra a la sala `room:{courseId}` (el gateway valida acceso y hace check-in). */
  joinMeeting(courseId: string): void {
    this.socket?.emit('meeting:join', { courseId });
  }

  /** Sale de la sala: check-out + aviso a los peers (idempotente en el server). */
  leaveMeeting(): void {
    this.socket?.emit('meeting:leave');
  }

  sendMeetingOffer(targetSocketId: string, offer: unknown): void {
    this.socket?.emit('meeting:offer', { targetSocketId, offer });
  }

  sendMeetingAnswer(targetSocketId: string, answer: unknown): void {
    this.socket?.emit('meeting:answer', { targetSocketId, answer });
  }

  sendMeetingIce(targetSocketId: string, candidate: unknown): void {
    this.socket?.emit('meeting:ice', { targetSocketId, candidate });
  }

  sendMeetingChat(content: string): void {
    this.socket?.emit('meeting:chat', { content });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private onSocketError(payload: SocketErrorPayload): void {
    if (payload?.code === 'AUTH_FAILED') {
      this.handleAuthFailure();
      return;
    }
    this.error$.next(payload);
  }

  private async handleAuthFailure(): Promise<void> {
    if (this.refreshing) {
      return;
    }
    this.refreshing = true;
    try {
      await lastValueFrom(this.authService.refreshToken());
      this.refreshing = false;
      this.connect();
    } catch (error) {
      this.refreshing = false;
      this.authService.clearSession();
      this.notificationService.warning(
        'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
      );
      this.router.navigate(['/login']);
    }
  }

  private socketUrl(): string {
    // En desarrollo el frontend corre en :4200 y el backend en :3000. El proxy de
    // Angular solo reenvía /api (sin websockets), así que el socket apunta directo
    // al backend. En producción frontend y backend comparten origen.
    if (window.location.port === '4200') {
      return 'http://localhost:3000';
    }
    return window.location.origin;
  }
}
