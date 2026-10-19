import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { NotificationsStore } from '@core/services/notifications.store';
import { UserNotification } from '@core/services/user-notifications.service';

interface NotificationGroup {
  key: string;
  label: string;
  unread: number;
  items: UserNotification[];
}

const pad = (value: number): string => value.toString().padStart(2, '0');

const startOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * Panel de notificaciones in-page (Spec O6b+c — "Campana y snackbar").
 *
 * Componente standalone abierto como MatDialog desde el navbar (carga lazy,
 * chunk < 500KB). Agrupa las notificaciones por día ("Hoy", "Ayer", fecha),
 * resalta las no leídas con un punto y las marca al hacer clic (o con
 * Enter/Espacio). "Marcar todas" vive en el encabezado y "Ver todas las
 * notificaciones" cierra el panel y lleva a la bandeja de mensajería.
 */
@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  templateUrl: './notifications-panel.component.html',
  styleUrls: ['./notifications-panel.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class NotificationsPanelComponent implements OnInit {
  readonly notifications = this.store.notifications;
  readonly loading = this.store.loading;
  readonly unreadCount = this.store.unreadCount;

  /** Subtítulo del encabezado: "Tienes N notificaciones sin leer" / "Estás al día". */
  readonly headerSubtitle = computed(() => {
    const count = this.unreadCount();
    if (count === 0) {
      return 'Estás al día';
    }
    return `Tienes ${count} ${
      count === 1 ? 'notificación' : 'notificaciones'
    } sin leer`;
  });

  /** Notificaciones agrupadas por día, en el orden desc que entrega el API. */
  readonly groups = computed<NotificationGroup[]>(() => {
    const groups: NotificationGroup[] = [];
    const byKey = new Map<string, NotificationGroup>();
    for (const notification of this.notifications()) {
      const date = this.toDate(notification.createdAt);
      const key = Number.isNaN(date.getTime())
        ? 'sin-fecha'
        : `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      let group = byKey.get(key);
      if (!group) {
        group = { key, label: this.dayLabel(date), unread: 0, items: [] };
        byKey.set(key, group);
        groups.push(group);
      }
      group.items.push(notification);
      if (!notification.read) {
        group.unread += 1;
      }
    }
    return groups;
  });

  constructor(
    readonly store: NotificationsStore,
    private dialogRef: MatDialogRef<NotificationsPanelComponent>,
    private dialog: MatDialog,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.store.load();
  }

  markRead(notification: UserNotification, event?: Event): void {
    event?.preventDefault();
    if (!notification.read) {
      this.store.markRead(notification._id);
    }
  }

  markAllRead(): void {
    this.store.markAllRead();
  }

  /** Cierra el panel (y cualquier diálogo apilado, p. ej. perfil) y va a mensajería. */
  viewAll(): void {
    this.dialog.closeAll();
    this.router.navigate(['/messaging']);
  }

  trackGroup(_index: number, group: NotificationGroup): string {
    return group.key;
  }

  trackById(_index: number, notification: UserNotification): string {
    return notification._id;
  }

  /** Ícono por tipo de notificación. */
  iconFor(type: string): string {
    const icons: Record<string, string> = {
      message: 'chat',
      course_archived: 'archive',
      course_restored: 'unarchive',
      task_graded: 'grade',
    };
    return icons[type] || 'notifications';
  }

  /** Hora compacta "HH:mm" (el día lo muestra el encabezado del grupo). */
  timeLabel(createdAt: Date | string): string {
    const date = this.toDate(createdAt);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  /** Etiqueta del grupo: "Hoy", "Ayer" o "14 de octubre [de 2025]". */
  private dayLabel(date: Date): string {
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const dayDiff = Math.round(
      (startOfDay(new Date()) - startOfDay(date)) / 86400000,
    );
    if (dayDiff <= 0) {
      return 'Hoy';
    }
    if (dayDiff === 1) {
      return 'Ayer';
    }
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
    };
    if (date.getFullYear() !== new Date().getFullYear()) {
      options.year = 'numeric';
    }
    return date.toLocaleDateString('es-PE', options);
  }

  private toDate(createdAt: Date | string): Date {
    return createdAt instanceof Date ? createdAt : new Date(createdAt);
  }
}
