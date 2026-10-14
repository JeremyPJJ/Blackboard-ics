import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Conversation, ConversationType, Message } from '../models/messaging.model';

/**
 * Acceso REST al módulo de mensajería. El historial de mensajes se obtiene por
 * REST (design: "Historico vía REST existente"); el envío en tiempo real va por WS.
 */
@Injectable({
  providedIn: 'root',
})
export class MessagingRestService {
  private apiUrl = '/api/messaging';

  constructor(private http: HttpClient) {}

  /**
   * Lista las conversaciones del usuario. Con `includeArchived=true` se
   * incluyen las archivadas por el usuario (Spec N6 — vista "Archivadas").
   */
  getConversations(includeArchived = false): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`, {
      params: includeArchived ? { includeArchived: 'true' } : {},
    });
  }

  /**
   * Crea una conversación vía REST. El backend valida el alcance (Spec:
   * super_admin → cualquiera; docente/estudiante → solo participantes de SUS
   * cursos) y responde 403/400 si no corresponde.
   */
  createConversation(
    type: ConversationType,
    participants: string[],
    courseId?: string,
    name?: string,
  ): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.apiUrl}/conversations`, {
      type,
      participants,
      courseId,
      name,
    });
  }

  getMessages(conversationId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/conversations/${conversationId}/messages`);
  }

  markAsRead(conversationId: string): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.apiUrl}/conversations/${conversationId}/read`, {});
  }

  /** Archiva la conversación para el usuario autenticado (Spec O6a). */
  archiveConversation(conversationId: string): Observable<Conversation> {
    return this.http.patch<Conversation>(
      `${this.apiUrl}/conversations/${conversationId}/archive`,
      {},
    );
  }

  /** Desarchiva la conversación para el usuario autenticado (Spec N6). */
  unarchiveConversation(conversationId: string): Observable<Conversation> {
    return this.http.patch<Conversation>(
      `${this.apiUrl}/conversations/${conversationId}/unarchive`,
      {},
    );
  }
}
