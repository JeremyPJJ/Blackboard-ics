import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterModule } from '@angular/router';
import { MeetingsService, Meeting } from '@features/meetings/services/meetings.service';
import { RoomParticipant, SessionHistoryItem } from '@features/meetings/models/meeting-session.model';
import { SessionHistoryGroup, groupHistoryByTitle } from './meeting-history.utils';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { MeetingFormDialogComponent } from './meeting-form-dialog.component';

/**
 * Reuniones del curso (Spec: Meetings — gestión en tab Información).
 *
 * Lista GET /meetings/course/:id con empty-state "Sin reuniones programadas".
 * Los estudiantes ven la lista en SOLO LECTURA (sin botones); el CRUD y la
 * gestión de participantes se muestran solo con los permisos `reuniones.*`.
 */
@Component({
  selector: 'app-meetings-section',
  standalone: true,
  templateUrl: './meetings-section.component.html',
  styleUrls: ['./meetings-section.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatExpansionModule,
    RouterModule,
  ],
})
export class MeetingsSectionComponent implements OnInit {
  @Input() courseId!: string;

  meetings: Meeting[] = [];
  participantNames: Record<string, string[]> = {}; // meetingId -> nombres (mismo orden)
  isLoading = true;

  /** Sesiones abiertas de la sala del curso (Spec F2 — badge "EN MARCHA"). */
  openSessions: RoomParticipant[] = [];
  isOpenSessionsLoading = true;

  history: SessionHistoryItem[] = [];
  /** Historial agrupado por título (Spec F2) — un panel por grupo. */
  historyGroups: SessionHistoryGroup[] = [];
  isHistoryLoading = true;

  constructor(
    private meetingsService: MeetingsService,
    private userService: UserService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.load();
    this.loadOpenSessions();
    this.loadHistory();
  }

  can(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  load() {
    this.isLoading = true;
    this.meetingsService.getByCourse(this.courseId).subscribe({
      next: (meetings) => {
        this.meetings = meetings;
        this.isLoading = false;
        this.resolveParticipantNames();
      },
      error: () => (this.isLoading = false),
    });
  }

  /** Sesiones abiertas → badge "EN MARCHA" (visible para todo miembro). */
  loadOpenSessions() {
    this.isOpenSessionsLoading = true;
    this.meetingsService.getOpenSessions(this.courseId).subscribe({
      next: (sessions) => {
        this.openSessions = sessions;
        this.isOpenSessionsLoading = false;
      },
      error: () => {
        this.openSessions = [];
        this.isOpenSessionsLoading = false;
      },
    });
  }

  /**
   * Título del badge EN MARCHA (Spec F2): el de la sesión abierta más antigua
   * (la que definió el primer entrante), con fallback 'Reunión'.
   */
  get openSessionTitle(): string {
    return this.openSessions[0]?.title?.trim() || 'Reunión';
  }

  loadHistory() {
    this.isHistoryLoading = true;
    this.meetingsService.getSessionHistory(this.courseId).subscribe({
      next: (history) => {
        this.history = history;
        this.historyGroups = groupHistoryByTitle(history);
        this.isHistoryLoading = false;
      },
      error: () => {
        this.history = [];
        this.historyGroups = [];
        this.isHistoryLoading = false;
      },
    });
  }

  participantName(meeting: Meeting, index: number): string {
    const names = this.participantNames[meeting._id];
    return names?.[index] || meeting.participants[index] || '';
  }

  private resolveParticipantNames() {
    const ids = new Set<string>();
    this.meetings.forEach(m => (m.participants || []).forEach(p => ids.add(p)));
    if (ids.size === 0) return;

    this.userService.getUsers().subscribe({
      next: (users) => {
        const byId = new Map(users.map(u => [u._id, `${u.names} ${u.lastNames}`.trim()]));
        this.participantNames = {};
        this.meetings.forEach(m => {
          this.participantNames[m._id] = (m.participants || [])
            .map(p => byId.get(p) || p)
            .filter(Boolean);
        });
      },
      error: () => {},
    });
  }

  meetingDate(m: Meeting): string {
    return new Date(m.scheduledDate).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
  }

  meetingTypeLabel(m: Meeting): string {
    return m.type === 'interna' ? 'Interna' : 'Externa';
  }

  historyDate(item: SessionHistoryItem): string {
    return new Date(item.checkInAt).toLocaleDateString('es-PE');
  }

  historyTime(item: SessionHistoryItem): string {
    return new Date(item.checkInAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  durationLabel(item: SessionHistoryItem): string {
    if (item.durationMinutes == null) return '—';
    const h = Math.floor(item.durationMinutes / 60);
    const m = item.durationMinutes % 60;
    return h === 0 ? `${m} min` : `${h}h ${m}min`;
  }

  platformLabel(m: Meeting): string {
    const labels: Record<string, string> = {
      zoom: 'Zoom', meet: 'Google Meet', teams: 'Microsoft Teams', other: 'Otra',
    };
    return labels[m.platform || ''] || m.platform || '—';
  }

  openCreate() {
    const dialogRef = this.dialog.open(MeetingFormDialogComponent, {
      width: '620px',
      maxWidth: '94vw',
      data: { courseId: this.courseId, meeting: null },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.load();
        this.notificationService.success('Reunión creada');
      }
    });
  }

  openEdit(meeting: Meeting) {
    const dialogRef = this.dialog.open(MeetingFormDialogComponent, {
      width: '620px',
      maxWidth: '94vw',
      data: { courseId: this.courseId, meeting },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.load();
        this.notificationService.success('Reunión actualizada');
      }
    });
  }

  remove(meeting: Meeting) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Reunión',
        message: `¿Está seguro de eliminar la reunión "${meeting.title}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.meetingsService.deleteMeeting(meeting._id).subscribe({
        next: () => {
          this.meetings = this.meetings.filter(m => m._id !== meeting._id);
          this.notificationService.success('Reunión eliminada');
        },
        error: (error) =>
          this.notificationService.error(error.error?.message || 'Error al eliminar la reunión'),
      });
    });
  }

  removeParticipant(meeting: Meeting, userId: string) {
    this.meetingsService.removeParticipant(meeting._id, userId).subscribe({
      next: () => {
        this.notificationService.success('Participante removido de la reunión');
        this.load();
      },
      error: (error) =>
        this.notificationService.error(error.error?.message || 'Error al remover el participante'),
    });
  }
}