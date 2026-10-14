import { Injectable, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { MeetingsService } from '../services/meetings.service';
import { NotificationService } from '@core/services/notification.service';
import { MeetingSession, RoomParticipant } from '../models/meeting-session.model';

/**
 * Estado de la sala de reuniones con Signals (Spec: Signals-based state).
 *
 * Check-in automático al entrar (`checkIn`) y check-out al salir:
 * - `checkOut()`: camino normal, usado en `ngOnDestroy` (el app sigue vivo).
 * - `checkOutOnUnload()`: `fetch` con `keepalive` para `beforeunload`/`pagehide`
 *   (cierre de pestaña o refresh), donde una petición HttpClient puede abortarse.
 *
 * El servidor es idempotente, por lo que un doble intento es inofensivo.
 */
@Injectable({
  providedIn: 'root',
})
export class MeetingsStore {
  readonly session = signal<MeetingSession | null>(null);
  readonly participants = signal<RoomParticipant[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private courseId: string | null = null;
  private checkedOut = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private meetingsService: MeetingsService,
    private notificationService: NotificationService,
  ) {}

  async checkIn(courseId: string, title?: string): Promise<void> {
    this.courseId = courseId;
    this.loading.set(true);
    this.error.set(null);
    try {
      const session = await lastValueFrom(this.meetingsService.joinCourseRoom(courseId, title));
      this.session.set(session);
    } catch (err: any) {
      const message = err?.error?.message ?? 'No se pudo ingresar a la sala';
      this.error.set(message);
      this.notificationService.error(message);
    } finally {
      this.loading.set(false);
    }
  }

  async refreshParticipants(): Promise<void> {
    if (!this.courseId) {
      return;
    }
    try {
      const participants = await lastValueFrom(
        this.meetingsService.getOpenSessions(this.courseId),
      );
      this.participants.set(participants);
    } catch {
      // Silencioso: el polling no debe romper la sala.
    }
  }

  /**
   * Comprueba si ya existe una sesión abierta en el curso (Spec F2). Usado por
   * el primer entrante para decidir si muestra el dialog de título antes del
   * check-in. Vacía/0 → no hay nadie en la sala (este usuario sería el primero).
   */
  async hasOpenSessions(courseId: string): Promise<boolean> {
    try {
      const sessions = await lastValueFrom(this.meetingsService.getOpenSessions(courseId));
      return sessions.length > 0;
    } catch {
      return false;
    }
  }

  startPolling(intervalMs = 10000): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => void this.refreshParticipants(), intervalMs);
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  async checkOut(): Promise<void> {
    this.stopPolling();
    const session = this.session();
    if (!session || this.checkedOut) {
      return;
    }
    this.checkedOut = true;
    try {
      await lastValueFrom(this.meetingsService.leaveCourseRoom(session._id));
    } catch {
      // Si la petición falló (p. ej. el navegador ya está descargando la página),
      // reintentar con fetch + keepalive antes de rendirse.
      this.checkedOut = false;
      this.checkOutOnUnload();
    }
  }

  /** Check-out durante unload: fetch con `keepalive` sobrevive al cierre. */
  checkOutOnUnload(): void {
    const session = this.session();
    if (!session || this.checkedOut) {
      return;
    }
    this.checkedOut = true;
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return;
    }
    try {
      fetch(`/api/meetings/session/${session._id}/leave`, {
        method: 'PATCH',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Nada más se puede hacer durante el unload.
    }
  }

  reset(): void {
    this.stopPolling();
    this.session.set(null);
    this.participants.set([]);
    this.error.set(null);
    this.checkedOut = false;
    this.courseId = null;
  }
}