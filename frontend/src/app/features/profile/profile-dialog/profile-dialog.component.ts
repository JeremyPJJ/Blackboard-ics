import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { CourseService } from '@core/services/course.service';
import { Course } from '@core/models';
import { ProfileService } from '../services/profile.service';
import { ProfileStore } from '../store/profile.store';

/** Pestañas del perfil: datos y seguridad (contraseña). */
type ProfileTab = 'info' | 'password';

/**
 * Diálogo de perfil accesible desde la barra de navegación ("Mi perfil").
 * Muestra los datos reales del usuario (nombre, correo, rol) y organiza el
 * contenido en dos pestañas: Información personal y Seguridad (cambio de
 * contraseña self-service).
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

  /** Pestaña activa del perfil (siempre inicia en información personal). */
  activeTab: ProfileTab = 'info';

  /** Visibilidad de cada campo de contraseña (ojo). */
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  /** Segmentos del medidor de seguridad. */
  readonly strengthSegments = [1, 2, 3, 4];

  private readonly strengthLabels = ['—', 'Débil', 'Media', 'Buena', 'Fuerte'];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private profileService: ProfileService,
    private courseService: CourseService,
    private notificationService: NotificationService,
    private router: Router,
    public store: ProfileStore,
    public dialogRef: MatDialogRef<ProfileDialogComponent>,
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
    this.activeTab = 'info';
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

  get user() {
    return this.store.user();
  }

  /** Etiqueta legible del rol, consistente con la barra superior. */
  get roleLabel(): string {
    const labels: Record<string, string> = {
      super_admin: 'Administrador',
      unidad_academica: 'Unidad Académica',
      secretaria: 'Secretaría',
      soporte: 'Soporte Técnico',
      docente: 'Docente',
      estudiante: 'Estudiante',
    };
    return labels[this.user?.role || ''] || 'Usuario';
  }

  /**
   * Medidor de seguridad (0-4) de la nueva contraseña: longitud mínima,
   * letra, número y carácter especial.
   */
  get passwordStrength(): { score: number; label: string } {
    const value: string = this.passwordForm.get('newPassword')?.value || '';
    if (!value) return { score: 0, label: this.strengthLabels[0] };

    let criteria = 0;
    if (value.length >= 8) criteria++;
    if (/[a-zA-Z]/.test(value)) criteria++;
    if (/\d/.test(value)) criteria++;
    if (/[^a-zA-Z0-9]/.test(value)) criteria++;

    const score = Math.max(1, Math.min(criteria, 4));
    return { score, label: this.strengthLabels[score] };
  }

  /** Índice de la pestaña activa para mat-tab-group (0: info, 1: seguridad). */
  get tabIndex(): number {
    switch (this.activeTab) {
      case 'password':
        return 1;
      default:
        return 0;
    }
  }

  onTabChange(index: number): void {
    this.activeTab = index === 1 ? 'password' : 'info';
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    if (field === 'current') this.showCurrentPassword = !this.showCurrentPassword;
    if (field === 'new') this.showNewPassword = !this.showNewPassword;
    if (field === 'confirm') this.showConfirmPassword = !this.showConfirmPassword;
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
