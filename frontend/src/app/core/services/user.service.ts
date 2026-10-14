import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = '/api/users';

  constructor(private http: HttpClient) {}

  getUsers(filters?: { role?: string; status?: string; tags?: string[]; search?: string }): Observable<User[]> {
    let params = new HttpParams();

    if (filters?.role) {
      params = params.set('role', filters.role);
    }

    if (filters?.status) {
      params = params.set('status', filters.status);
    }

    if (filters?.tags && filters.tags.length > 0) {
      params = params.set('tags', filters.tags.join(','));
    }

    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<User[]>(this.apiUrl, { params });
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  restoreUser(id: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/${id}/restore`, {});
  }

  changePassword(id: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/change-password`, { newPassword });
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }
}
