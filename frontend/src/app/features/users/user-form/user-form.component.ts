import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '@core/services/user.service';
import { NavigationService } from '@core/services/navigation.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-user-form',
  standalone: false,
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEdit = false;
  isLoading = false;
  errorMessage = '';
  hidePassword = true;
  userId: string | null = null;

  // Catálogo de permisos disponibles
  availablePermissions: { key: string; label: string }[] = [
    { key: 'usuarios.ver', label: 'Ver usuarios' },
    { key: 'usuarios.crear', label: 'Crear usuarios' },
    { key: 'usuarios.editar', label: 'Editar usuarios' },
    { key: 'usuarios.eliminar', label: 'Eliminar usuarios' },
    { key: 'cursos.ver', label: 'Ver cursos' },
    { key: 'cursos.crear', label: 'Crear cursos' },
    { key: 'cursos.editar', label: 'Editar cursos' },
    { key: 'cursos.archivar', label: 'Archivar cursos' },
    { key: 'tareas.ver', label: 'Ver tareas' },
    { key: 'tareas.crear', label: 'Crear tareas' },
    { key: 'tareas.editar', label: 'Editar tareas' },
    { key: 'tareas.calificar', label: 'Calificar tareas' },
    { key: 'asistencia.ver', label: 'Ver asistencia' },
    { key: 'asistencia.registrar', label: 'Registrar asistencia' },
    { key: 'asistencia.modificar', label: 'Modificar asistencia' },
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router,
    private navigationService: NavigationService
  ) {
    this.userForm = this.fb.group({
      dni: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8)]],
      names: ['', Validators.required],
      lastNames: ['', Validators.required],
      institutionalEmail: ['', [Validators.required, Validators.email]],
      personalEmail: ['', Validators.email],
      phone: [''],
      birthDate: ['', [this.birthDateValidator]],
      role: ['estudiante', Validators.required],
      status: ['activo', Validators.required],
      password: ['', [Validators.minLength(6)]],
      permissions: [[]],
      contractYear: [null],
      contractSemester: [null],
    });
  }

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id');

    if (this.userId) {
      this.isEdit = true;
      this.loadUser();
      // En modo edición, password es opcional
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  private birthDateValidator(control: any): { [key: string]: boolean } | null {
    if (!control.value) return null;

    const birthDate = new Date(control.value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    // Validar que no sea fecha futura
    if (birthDate > today) {
      return { futureDate: true };
    }

    // Validar edad mínima (14 años para estudiantes)
    if (age < 14) {
      return { tooYoung: true };
    }

    return null;
  }

  loadUser() {
    if (!this.userId) return;

    this.isLoading = true;
    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.userForm.patchValue({
          dni: user.dni,
          names: user.names,
          lastNames: user.lastNames,
          institutionalEmail: user.institutionalEmail,
          personalEmail: user.personalEmail,
          phone: user.phone,
          birthDate: user.birthDate,
          role: user.role,
          status: user.status,
          permissions: user.permissions || [],
          contractYear: user.contractYear,
          contractSemester: user.contractSemester,
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.isLoading = false;
        this.errorMessage = 'Error al cargar el usuario';
      },
    });
  }

  onSubmit() {
    if (this.userForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const formData = { ...this.userForm.value };

    // En modo edición, eliminar password si está vacío
    if (this.isEdit && (!formData.password || formData.password.trim() === '')) {
      delete formData.password;
    }

    if (this.isEdit && this.userId) {
      this.userService.updateUser(this.userId, formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.notificationService.success('Usuario actualizado exitosamente');
          this.router.navigate(['/users']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Error al actualizar el usuario';
          this.notificationService.error(this.errorMessage);
        },
      });
    } else {
      this.userService.createUser(formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.notificationService.success('Usuario creado exitosamente');
          this.router.navigate(['/users']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Error al crear el usuario';
          this.notificationService.error(this.errorMessage);
        },
      });
    }
  }

  goBack(): void {
    this.navigationService.goBack();
  }
}
