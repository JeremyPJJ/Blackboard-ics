import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationsStore } from '@core/services/notifications.store';

/**
 * Panel de notificaciones in-page (Spec O6b+c — "Campana y snackbar").
 *
 * Componente standalone abierto como MatDialog desde el navbar (carga lazy,
 * chunk < 500KB). Lista las no leídas del usuario, permite marcar individuales
 * o todas como leídas y limpia el badge de la campana (el store recalcula el
 * conteo desde REST al marcar).
 */
@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  templateUrl: './notifications-panel.component.html',
  styleUrls: ['./notifications-panel.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
})
export class NotificationsPanelComponent implements OnInit {
  readonly notifications = this.store.notifications;
  readonly loading = this.store.loading;
  readonly unreadCount = this.store.unreadCount;

  constructor(readonly store: NotificationsStore) {}

  ngOnInit(): void {
    this.store.load();
  }

  markRead(id: string): void {
    this.store.markRead(id);
  }

  markAllRead(): void {
    this.store.markAllRead();
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
}