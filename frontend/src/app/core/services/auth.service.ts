import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, LoginResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap(response => {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user as any);
      })
    );
  }

  logout(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post('/api/auth/logout', { refreshToken }).pipe(
      tap(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
      })
    );
  }

  refreshToken(): Observable<{ accessToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<{ accessToken: string }>('/api/auth/refresh', { refreshToken }).pipe(
      tap(response => {
        localStorage.setItem('accessToken', response.accessToken);
      })
    );
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;

    // Verificar expiración del JWT
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiration = payload.exp * 1000; // Convertir a milisegundos
      return Date.now() < expiration;
    } catch {
      // Si no se puede decodificar, asumir que no es válido
      return false;
    }
  }

  clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'super_admin' || user?.role === 'unidad_academica' || user?.role === 'secretaria' || user?.role === 'soporte';
  }

  isTeacher(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'docente';
  }

  isStudent(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'estudiante';
  }

  /** Roles de administración sin alcance de curso (no pueden crear conversaciones). */
  isStaffRole(): boolean {
    const role = this.getCurrentUser()?.role;
    return role === 'unidad_academica' || role === 'secretaria' || role === 'soporte';
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Super admin: acceso total
    if (user.role === 'super_admin') return true;

    // Si el usuario tiene permisos explícitos asignados, usar SOLO esos
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions.includes(permission);
    }

    // Sin permisos explícitos: permisos por defecto del rol
    const rolePermissions: Record<string, string[]> = {
      'unidad_academica': ['usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'cursos.ver', 'cursos.crear', 'cursos.editar', 'encuestas.crear', 'encuestas.ver', 'ofertas.ver', 'ofertas.crear', 'ofertas.editar', 'ofertas.eliminar', 'ofertas.revisar', 'reuniones.crear', 'reuniones.editar', 'reuniones.eliminar'],
      'secretaria': ['usuarios.ver', 'cursos.ver', 'ofertas.ver', 'ofertas.crear', 'ofertas.editar', 'ofertas.revisar', 'reuniones.crear', 'reuniones.editar', 'reuniones.eliminar'],
      'soporte': ['usuarios.ver', 'cursos.ver', 'ofertas.ver', 'reuniones.crear', 'reuniones.editar', 'reuniones.eliminar'],
      'docente': ['cursos.ver', 'cursos.crear', 'cursos.editar', 'cursos.archivar', 'tareas.ver', 'tareas.crear', 'tareas.editar', 'tareas.eliminar', 'tareas.calificar', 'asistencia.ver', 'asistencia.registrar', 'asistencia.modificar', 'foros.crear', 'foros.post', 'encuestas.crear', 'encuestas.ver', 'ofertas.crear', 'reuniones.crear', 'reuniones.editar', 'reuniones.eliminar', 'examenes.calificar'],
      'estudiante': ['cursos.ver', 'tareas.ver', 'tareas.entregar', 'foros.post', 'ofertas.ver', 'ofertas.postular'],
    };

    const permissions = rolePermissions[user.role] || [];
    return permissions.includes('*') || permissions.includes(permission);
  }
}
