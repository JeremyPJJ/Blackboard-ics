import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserNotification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  courseId?: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class UserNotificationsService {
  private apiUrl = '/api/notifications';

  constructor(private http: HttpClient) {}

  getMine(): Observable<UserNotification[]> {
    return this.http.get<UserNotification[]>(this.apiUrl);
  }

  markRead(id: string): Observable<UserNotification> {
    return this.http.post<UserNotification>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/read-all`, {});
  }
}