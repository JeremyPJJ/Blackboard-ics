import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit() {
    // Si ya está autenticado y hay usuario, redirigir al dashboard
    if (this.authService.isAuthenticated() && this.authService.getCurrentUser()) {
      this.redirectToDashboard();
      return;
    }
    // Sesión a medio guardar (token sin user): limpiar
    if (localStorage.getItem('accessToken')) {
      this.authService.clearSession();
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.isLoading = false;

        // Redirigir según el rol
        const role = response.user.role;
        let returnUrl = '/dashboard';

        if (role === 'docente') {
          returnUrl = '/dashboard/teacher';
        } else if (role === 'estudiante') {
          returnUrl = '/dashboard/student';
        } else {
          returnUrl = '/dashboard/admin';
        }

        this.notificationService.success(`Bienvenido ${response.user.names}`);
        this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error al iniciar sesión. Verifique sus credenciales.';
        this.notificationService.error(this.errorMessage);
      },
    });
  }

  private redirectToDashboard() {
    const role = this.authService.getCurrentUser()?.role;
    let returnUrl = '/dashboard';

    if (role === 'docente') {
      returnUrl = '/dashboard/teacher';
    } else if (role === 'estudiante') {
      returnUrl = '/dashboard/student';
    } else {
      returnUrl = '/dashboard/admin';
    }

    this.router.navigateByUrl(returnUrl);
  }
}
