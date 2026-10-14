import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '@core/models/user.model';

/**
 * Acceso REST al perfil del usuario y al cambio de contraseña self-service
 * (Spec: Profile UI + Change Password domain).
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  /** Perfil del usuario autenticado (GET /users/profile — AuthGuard jwt). */
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/profile`);
  }

  /** Cambio de contraseña (POST /auth/change-password — AuthGuard jwt). */
  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/change-password`, {
      currentPassword,
      newPassword,
    });
  }
}
