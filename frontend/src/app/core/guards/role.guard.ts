import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = this.authService.getCurrentUser();

    if (!user) {
      // Si hay token pero no user (sesión a medio guardar), limpiar para evitar loop
      if (localStorage.getItem('accessToken')) {
        this.authService.clearSession();
      }
      this.router.navigate(['/login']);
      return false;
    }

    const requiredRoles = route.data['roles'] as string[];
    
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      // Redirigir al dashboard correspondiente según el rol
      this.router.navigate([this.getDashboardRoute(user.role)]);
      return false;
    }

    return true;
  }

  private getDashboardRoute(role: string): string {
    switch (role) {
      case 'super_admin':
      case 'unidad_academica':
      case 'secretaria':
      case 'soporte':
        return '/dashboard/admin';
      case 'docente':
        return '/dashboard/teacher';
      case 'estudiante':
        return '/dashboard/student';
      default:
        return '/dashboard/admin';
    }
  }
}
