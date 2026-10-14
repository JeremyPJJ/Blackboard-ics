import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { CourseService } from '@core/services/course.service';
import { NotificationService } from '@core/services/notification.service';
import { MessagingStore } from '../../store/messaging.store';

export interface NewConversationDialogData {
  courseId?: string;
}

interface PickerOption {
  id: string;
  name: string;
  role: string;
}

/**
 * Dialog "Nueva conversación" (Spec: Messaging — picker de participantes).
 *
 * - super_admin: ve TODOS los usuarios (getUsers) y puede crear sin curso.
 * - resto (docente/estudiante): elige un curso propio (getCourses por
 *   studentId/teacherId; el backend ya restringe a los del usuario) y los
 *   participantes se filtran a students ∪ teachers de ese curso (misma regla
 *   de alcance del backend).
 * - Nombre opcional solo para conversaciones grupales (2+ participantes).
 */
@Component({
  selector: 'app-new-conversation-dialog',
  standalone: false,
  templateUrl: './new-conversation-dialog.component.html',
  styleUrls: ['./new-conversation-dialog.component.scss'],
})
export class NewConversationDialogComponent implements OnInit {
  isSuperAdmin = false;
  loading = true;

  courses: { id: string; name: string }[] = [];
  selectedCourseId = '';

  allOptions: PickerOption[] = [];
  courseOptions: PickerOption[] = [];
  selectedIds: string[] = [];
  filter = '';
  name = '';
  saving = false;

  constructor(
    public dialogRef: MatDialogRef<NewConversationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NewConversationDialogData,
    private authService: AuthService,
    private userService: UserService,
    private courseService: CourseService,
    private notificationService: NotificationService,
    private store: MessagingStore,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.isSuperAdmin = user?.role === 'super_admin';
    if (this.isSuperAdmin) {
      this.loadAllUsers();
    } else {
      this.loadCourses(user?._id);
    }
  }

  get filteredOptions(): PickerOption[] {
    const source = this.isSuperAdmin ? this.allOptions : this.courseOptions;
    const q = this.filter.trim().toLowerCase();
    if (!q) {
      return source;
    }
    return source.filter((o) => o.name.toLowerCase().includes(q));
  }

  get showPicker(): boolean {
    return this.isSuperAdmin || !!this.selectedCourseId;
  }

  get canSave(): boolean {
    return !this.loading && !this.saving && this.showPicker && this.selectedIds.length > 0;
  }

  onCourseChange(): void {
    this.selectedIds = [];
    this.courseOptions = [];
    if (!this.selectedCourseId) {
      return;
    }
    this.loading = true;
    this.courseService.getCourseById(this.selectedCourseId).subscribe({
      next: (course) => {
        const memberIds = new Set<string>([
          ...(course.teachers || []).map((t) => t.userId),
          ...(course.students || []).map((s) => s.userId),
        ]);
        // Resolver nombres con una sola llamada a getUsers (patrón meeting-form-dialog).
        this.userService.getUsers().subscribe({
          next: (users) => {
            const myId = this.authService.getCurrentUser()?._id;
            this.courseOptions = users
              .filter((u) => memberIds.has(u._id) && u._id !== myId)
              .map((u) => ({ id: u._id, name: `${u.names} ${u.lastNames}`.trim(), role: u.role }));
            this.loading = false;
          },
          error: () => {
            this.loading = false;
            this.notificationService.error('No se pudieron cargar los participantes');
          },
        });
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('No se pudo cargar el curso seleccionado');
      },
    });
  }

  toggle(optionId: string, checked: boolean): void {
    this.selectedIds = checked
      ? [...this.selectedIds, optionId]
      : this.selectedIds.filter((id) => id !== optionId);
  }

  roleLabel(role: string): string {
    const labels: Record<string, string> = {
      super_admin: 'Super admin',
      unidad_academica: 'Unidad académica',
      secretaria: 'Secretaría',
      soporte: 'Soporte',
      docente: 'Docente',
      estudiante: 'Estudiante',
    };
    return labels[role] || role;
  }

  save(): void {
    if (!this.canSave) {
      return;
    }
    this.saving = true;
    const courseId = this.isSuperAdmin ? this.data?.courseId : this.selectedCourseId;
    const name = this.selectedIds.length > 1 && this.name?.trim() ? this.name.trim() : undefined;

    this.store
      .createConversation(this.selectedIds, courseId, name)
      .then(() => {
        this.saving = false;
        this.dialogRef.close(true);
      })
      .catch(() => {
        this.saving = false;
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private loadAllUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        const myId = this.authService.getCurrentUser()?._id;
        this.allOptions = users
          .filter((u) => u._id !== myId)
          .map((u) => ({ id: u._id, name: `${u.names} ${u.lastNames}`.trim(), role: u.role }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('No se pudieron cargar los usuarios');
      },
    });
  }

  private loadCourses(userId?: string): void {
    if (!userId) {
      this.loading = false;
      return;
    }
    const user = this.authService.getCurrentUser();
    const filters =
      user?.role === 'estudiante' ? { studentId: userId } : { teacherId: userId };
    this.courseService.getCourses(filters).subscribe({
      next: (courses) => {
        this.courses = courses.map((c) => ({ id: c._id, name: c.name }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('No se pudieron cargar tus cursos');
      },
    });
  }
}