import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { CourseService } from '@core/services/course.service';
import { Course } from '@core/models';
import { ProfileService } from '../services/profile.service';
import { ProfileStore } from '../store/profile.store';

/**
 * Diálogo de perfil accesible desde la barra de navegación ("Mi perfil").
 * Muestra los datos del usuario y un formulario de cambio de contraseña
 * self-service (Spec: Profile UI — "Open profile").
 *
 * Flujo post-éxito: el backend revoca TODOS los refresh tokens del usuario
 * (decisión del diseño → fuerza re-login en todos los dispositivos), así que la
 * sesión actual ya no puede renovarse. Tras el éxito se limpia la sesión y se
 * redirige a /login.
 */
@Component({
  selector: 'app-profile-dialog',
  standalone: false,
  templateUrl: './profile-dialog.component.html',
  styleUrls: ['./profile-dialog.component.scss'],
})
export class ProfileDialogComponent implements OnInit {
  passwordForm: FormGroup;
  /** Cursos del usuario (docente → a cargo; staff → activos) — Spec O8. */
  courses: Course[] = [];
  coursesLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private profileService: ProfileService,
    private courseService: CourseService,
    private notificationService: NotificationService,
    private router: Router,
    public store: ProfileStore,
    public dialogRef: MatDialogRef<ProfileDialogComponent>,
    private dialog: MatDialog,
  ) {
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  ngOnInit(): void {
    this.store.reset();
    this.loadProfile();
    this.loadCourses();
  }

  /** super_admin no lleva cursos (Spec N1): no ve la sección, ve empty-state. */
  get isSuperAdmin(): boolean {
    return this.authService.getCurrentUser()?.role === 'super_admin';
  }

  /** ¿Mostrar "Mis cursos"? Docente (a cargo) y staff (activos); super_admin NO (Spec N1). */
  get showCoursesSection(): boolean {
    return this.authService.isTeacher() || (this.authService.isAdmin() && !this.isSuperAdmin);
  }

  private loadCourses(): void {
    if (!this.showCoursesSection) return;
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.coursesLoading = true;
    const filters = user.role === 'docente'
      ? { teacherId: user._id }
      : { status: 'activo' };

    this.courseService.getCourses(filters).subscribe({
      next: (courses) => {
        this.courses = courses;
        this.coursesLoading = false;
      },
      error: () => {
        this.coursesLoading = false;
        this.notificationService.error('No se pudieron cargar tus cursos');
      },
    });
  }

  goToCourse(courseId: string): void {
    this.dialogRef.close();
    this.router.navigate(['/courses', courseId]);
  }

  /**
   * Abre el panel de notificaciones como dialog (Spec N2 — el navbar ya no tiene
   * campana; el acceso vive en el perfil). Carga lazy, chunk < 500KB.
   */
  async openNotifications(): Promise<void> {
    const { NotificationsPanelComponent } = await import(
      '@features/notifications/notifications-panel.component'
    );
    this.dialog.open(NotificationsPanelComponent, {
      width: '520px',
      maxWidth: '96vw',
      autoFocus: false,
    });
  }

  get user() {
    return this.store.user();
  }

  get submitting() {
    return this.store.submitting();
  }

  get success() {
    return this.store.success();
  }

  get error() {
    return this.store.error();
  }

  private loadProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (user) => this.store.setUser(user),
      error: () => this.notificationService.error('No se pudo cargar tu perfil'),
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPass = form.get('newPassword')?.value;
    const confirm = form.get('confirmPassword')?.value;
    return newPass && confirm && newPass !== confirm ? { passwordMismatch: true } : null;
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) return;

    this.store.setError(null);
    this.store.setSuccess(null);
    this.store.setSubmitting(true);

    const { currentPassword, newPassword } = this.passwordForm.value;

    this.profileService.changePassword(currentPassword, newPassword).subscribe({
      next: (res) => {
        this.store.setSubmitting(false);
        this.store.setSuccess(res.message);
        // Los refresh tokens fueron revocados → la sesión actual no puede renovarse.
        // Limpiar sesión y forzar re-login.
        this.authService.clearSession();
        this.notificationService.success('Contraseña actualizada. Vuelve a iniciar sesión.');
        this.dialogRef.close();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.store.setSubmitting(false);
        const message = err?.error?.message || 'No se pudo cambiar la contraseña';
        this.store.setError(message);
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
