import { Injectable, computed, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { CourseService } from './course.service';
import { NotificationService } from './notification.service';
import {
  UserNotification,
  UserNotificationsService,
} from './user-notifications.service';
import { MessagingSocketService } from '@features/messaging/services/messaging-socket.service';

/**
 * Estado global de notificaciones in-page (Spec O6b+c).
 *
 * - `unreadCount` alimenta el badge de la campana en el navbar.
 * - Escucha el evento WS `notification:new` del gateway de mensajería: muestra
 *   un snackbar breve y recarga la lista vía REST (autoritativa → sin doble
 *   conteo, y funciona también offline al navegar).
 * - Los mensajes propios (senderId === myId) no generan snackbar.
 * - Las conversaciones archivadas no llegan: el gateway no emite a sus rooms.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsStore {
  readonly notifications = signal<UserNotification[]>([]);
  readonly loading = signal(false);

  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.read).length,
  );

  /**
   * Carrera derivada del usuario (N3), cacheada por sesión:
   * `undefined` = aún sin resolver, `null` = sin carrera (card estática),
   * string = key normalizada sin acentos (notif-career-{key}).
   */
  readonly careerKey = signal<string | null | undefined>(undefined);

  constructor(
    private rest: UserNotificationsService,
    private socket: MessagingSocketService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private courseService: CourseService,
  ) {
    this.socket.notification.subscribe((payload) => this.onNotificationNew(payload));
  }

  /** Recarga la lista desde REST y recalcula el conteo (sin doble conteo). */
  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const notifications = await lastValueFrom(this.rest.getMine());
      this.notifications.set(notifications ?? []);
    } catch {
      // Silencioso: el badge simplemente conserva el último valor conocido.
    } finally {
      this.loading.set(false);
    }
  }

  async markRead(id: string): Promise<void> {
    try {
      await lastValueFrom(this.rest.markRead(id));
      await this.load();
    } catch {
      // Silencioso
    }
  }

  async markAllRead(): Promise<void> {
    try {
      await lastValueFrom(this.rest.markAllRead());
      await this.load();
    } catch {
      // Silencioso
    }
  }

  private async onNotificationNew(payload: {
    type: string;
    conversationId: string;
    senderId: string;
    preview?: string;
    sentAt: string;
  }): Promise<void> {
    const myId = this.authService.getCurrentUser()?._id;
    if (!myId || payload.senderId === myId) {
      return;
    }
    this.load();
    const careerKey = await this.resolveCareerKey();
    this.notificationService.info(
      payload.preview ? `Nuevo mensaje: ${payload.preview}` : 'Nuevo mensaje',
      careerKey ? 4000 : undefined,
      careerKey ? `notif-career-${careerKey}` : undefined,
    );
  }

  /**
   * Deriva la carrera del usuario desde su PRIMER curso (orden de getCourses)
   * y la cachea por sesión: una sola llamada REST aunque lleguen varias
   * notificaciones (esc. Cache de carrera). Sin cursos o error → null.
   */
  private async resolveCareerKey(): Promise<string | null> {
    const cached = this.careerKey();
    if (cached !== undefined) {
      return cached;
    }
    let key: string | null = null;
    const myId = this.authService.getCurrentUser()?._id;
    if (myId) {
      try {
        const courses = await lastValueFrom(
          this.courseService.getCourses({ studentId: myId }),
        );
        const career = courses?.[0]?.career;
        if (career) {
          key = this.normalizeCareerKey(career);
        }
      } catch {
        // Silencioso: sin carrera → card estática (fallback del spec).
      }
    }
    this.careerKey.set(key);
    return key;
  }

  /** Normaliza course.career a una key de clase CSS sin acentos (N3). */
  private normalizeCareerKey(career: string): string {
    return career
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
  }
}