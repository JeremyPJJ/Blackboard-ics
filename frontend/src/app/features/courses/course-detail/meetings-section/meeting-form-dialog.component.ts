import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MeetingsService, Meeting } from '@features/meetings/services/meetings.service';
import { CourseService } from '@core/services/course.service';
import { UserService } from '@core/services/user.service';
import { NotificationService } from '@core/services/notification.service';

export interface MeetingFormData {
  courseId: string;
  meeting?: Meeting | null;
  weekNumber?: number;
  sessionNumber?: number;
}

/**
 * Dialog crear/editar reunión (Spec: Meetings — gestión en tab Información).
 *
 * Campos según el schema backend de Meeting: título, descripción, fecha,
 * startTime/endTime, type (interna/externa), platform, externalLink/meetingId/
 * password y participantes (mat-select multi de los estudiantes del curso).
 * weekNumber/sessionNumber se autocompletan (1 o el contexto de la sección).
 */
@Component({
  selector: 'app-meeting-form-dialog',
  standalone: true,
  templateUrl: './meeting-form-dialog.component.html',
  styleUrls: ['./meeting-form-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
})
export class MeetingFormDialogComponent implements OnInit {
  form: FormGroup;
  studentOptions: { id: string; name: string }[] = [];
  saving = false;
  isEdit = false;

  constructor(
    public dialogRef: MatDialogRef<MeetingFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MeetingFormData,
    private fb: FormBuilder,
    private meetingsService: MeetingsService,
    private courseService: CourseService,
    private userService: UserService,
    private notificationService: NotificationService,
  ) {
    this.isEdit = !!data.meeting;
    const m = data.meeting;
    this.form = this.fb.group({
      title: [m?.title || '', Validators.required],
      description: [m?.description || ''],
      scheduledDate: [m ? new Date(m.scheduledDate) : null, Validators.required],
      startTime: [m ? this.toTime(m.startTime) : '08:00', Validators.required],
      endTime: [m ? this.toTime(m.endTime) : '09:00', Validators.required],
      type: [m?.type || 'interna', Validators.required],
      platform: [m?.platform || 'meet'],
      externalLink: [m?.externalLink || ''],
      meetingId: [m?.meetingId || ''],
      password: [m?.password || ''],
      participants: [(m?.participants || []) as string[]],
    });
  }

  ngOnInit() {
    this.loadStudents();
  }

  private loadStudents() {
    this.courseService.getCourseById(this.data.courseId).subscribe({
      next: (course) => {
        const studentIds = (course.students || []).map((s: any) => s.userId);
        this.userService.getUsers().subscribe({
          next: (users) => {
            this.studentOptions = users
              .filter(u => u.role === 'estudiante' && studentIds.includes(u._id))
              .map(u => ({ id: u._id, name: `${u.names} ${u.lastNames}`.trim() }));
          },
          error: () => {},
        });
      },
      error: () => {},
    });
  }

  private toTime(date: Date): string {
    const d = new Date(date);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  save() {
    if (this.form.invalid || this.saving) return;
    this.saving = true;

    const v = this.form.value;
    const date = new Date(v.scheduledDate);
    const [sh, sm] = String(v.startTime || '08:00').split(':').map(Number);
    const [eh, em] = String(v.endTime || '09:00').split(':').map(Number);
    const startTime = new Date(date);
    startTime.setHours(sh || 0, sm || 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(eh || 0, em || 0, 0, 0);

    const payload = {
      title: v.title.trim(),
      description: v.description?.trim() || '',
      weekNumber: this.data.weekNumber || 1,
      sessionNumber: this.data.sessionNumber || 1,
      scheduledDate: date,
      startTime,
      endTime,
      type: v.type,
      platform: v.platform || undefined,
      externalLink: v.externalLink?.trim() || undefined,
      meetingId: v.meetingId?.trim() || undefined,
      password: v.password?.trim() || undefined,
      participants: v.participants || [],
    };

    const request = this.isEdit && this.data.meeting
      ? this.meetingsService.updateMeeting(this.data.meeting._id, payload)
      : this.meetingsService.createMeeting(payload);

    request.subscribe({
      next: (meeting) => {
        this.saving = false;
        this.dialogRef.close(meeting);
      },
      error: (error) => {
        this.saving = false;
        this.notificationService.error(error.error?.message || 'Error al guardar la reunión');
      },
    });
  }

  cancel() {
    this.dialogRef.close();
  }
}