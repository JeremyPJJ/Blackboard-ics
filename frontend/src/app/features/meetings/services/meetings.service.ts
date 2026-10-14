import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MeetingSession, RoomParticipant, SessionHistoryItem } from '../models/meeting-session.model';

/** Reunión programada de un curso (Spec: Meetings — gestión en tab Información). */
export interface Meeting {
  _id: string;
  title: string;
  description?: string;
  courseId: string;
  weekNumber: number;
  sessionNumber: number;
  scheduledDate: Date;
  startTime: Date;
  endTime: Date;
  type: 'interna' | 'externa';
  platform?: 'zoom' | 'meet' | 'teams' | 'other';
  externalLink?: string;
  meetingId?: string;
  password?: string;
  participants: string[];
  recordingUrl?: string;
  notes?: string;
}

/**
 * Acceso REST a la sala de reuniones por curso. El check-in/check-out es
 * automático (sin botones manuales — Spec: Meetings); estos métodos los llaman
 * el ciclo de vida del componente y los handlers de unload.
 */
@Injectable({
  providedIn: 'root',
})
export class MeetingsService {
  private apiUrl = '/api/meetings';

  constructor(private http: HttpClient) {}

  // ─── Gestión de reuniones programadas (Spec: Meetings — tab Información) ──

  getByCourse(courseId: string): Observable<Meeting[]> {
    return this.http.get<Meeting[]>(`${this.apiUrl}/course/${courseId}`);
  }

  createMeeting(data: Partial<Meeting>): Observable<Meeting> {
    return this.http.post<Meeting>(this.apiUrl, data);
  }

  updateMeeting(id: string, data: Partial<Meeting>): Observable<Meeting> {
    return this.http.patch<Meeting>(`${this.apiUrl}/${id}`, data);
  }

  deleteMeeting(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  addParticipant(id: string, userId: string): Observable<Meeting> {
    return this.http.post<Meeting>(`${this.apiUrl}/${id}/participants/${userId}`, {});
  }

  removeParticipant(id: string, userId: string): Observable<Meeting> {
    return this.http.delete<Meeting>(`${this.apiUrl}/${id}/participants/${userId}`);
  }

  // ─── Sala fija por curso (check-in/out automáticos) ───────────────────────

  joinCourseRoom(courseId: string, title?: string): Observable<MeetingSession> {
    return this.http.post<MeetingSession>(`${this.apiUrl}/course/${courseId}/join`, { title });
  }

  leaveCourseRoom(sessionId: string): Observable<MeetingSession> {
    return this.http.patch<MeetingSession>(`${this.apiUrl}/session/${sessionId}/leave`, {});
  }

  getOpenSessions(courseId: string): Observable<RoomParticipant[]> {
    return this.http.get<RoomParticipant[]>(`${this.apiUrl}/course/${courseId}/sessions`);
  }

  /** Historial de sesiones cerradas del curso (Spec: Meetings O5). */
  getSessionHistory(courseId: string): Observable<SessionHistoryItem[]> {
    return this.http.get<SessionHistoryItem[]>(`${this.apiUrl}/course/${courseId}/sessions/history`);
  }
}