import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Course } from '@core/models';
import { AuthService } from '@core/services/auth.service';
import { MessagingStore } from '@features/messaging/store/messaging.store';

export interface StudentProfileData {
  student: {
    id: string;
    name: string;
    email: string;
    dni: string;
    photo?: string;
    career?: string;
  };
  courses: Course[];
  courseId?: string;
}

@Component({
  selector: 'app-student-profile-dialog',
  standalone: false,
  templateUrl: './student-profile-dialog.component.html',
  styleUrls: ['./student-profile-dialog.component.scss']
})
export class StudentProfileDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<StudentProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StudentProfileData,
    private authService: AuthService,
    private messagingStore: MessagingStore,
    private router: Router,
  ) {}

  /** Roles staff no pueden crear conversaciones → ocultar botón. */
  get isStaff(): boolean {
    return this.authService.isStaffRole();
  }

  /** Abre (o crea) la conversación individual con el estudiante y navega a /messaging. */
  async sendMessageTo() {
    try {
      await this.messagingStore.findOrCreateConversation(this.data.student.id, this.data.courseId);
      this.dialogRef.close();
      this.router.navigate(['/messaging']);
    } catch {
      // 403/error ya notificado por el store — no navegar (Spec R4)
    }
  }

  getCareer(): string {
    if (this.data.student.career) {
      return this.data.student.career;
    }
    if (this.data.courses.length > 0) {
      return this.data.courses[0].career;
    }
    return '—';
  }
}