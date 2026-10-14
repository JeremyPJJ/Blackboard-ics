import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ForumPost {
  authorId: string;
  content: string;
  createdAt: Date;
  editedAt?: Date;
  attachments: string[];
  reactions: string[];
  replies: any[];
}

export interface Forum {
  _id: string;
  title: string;
  description?: string;
  courseId: string;
  weekNumber: number;
  sessionNumber: number;
  posts: ForumPost[];
  isLocked?: boolean;
  isPinned?: boolean;
  isEvaluated?: boolean;
  availableFrom?: Date;
  evaluations?: any[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class ForumService {
  private apiUrl = '/api/forums';

  constructor(private http: HttpClient) {}

  getForumsByCourse(courseId: string): Observable<Forum[]> {
    return this.http.get<Forum[]>(`${this.apiUrl}/course/${courseId}`);
  }

  getForum(id: string): Observable<Forum> {
    return this.http.get<Forum>(`${this.apiUrl}/${id}`);
  }

  createForum(data: any): Observable<Forum> {
    return this.http.post<Forum>(this.apiUrl, data);
  }

  updateForum(id: string, data: any): Observable<Forum> {
    return this.http.patch<Forum>(`${this.apiUrl}/${id}`, data);
  }

  evaluateParticipant(id: string, userId: string, score: number, feedback?: string): Observable<Forum> {
    return this.http.post<Forum>(`${this.apiUrl}/${id}/evaluations`, { userId, score, feedback });
  }

  getEvaluations(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/evaluations`);
  }

  addPost(forumId: string, content: string): Observable<Forum> {
    return this.http.post<Forum>(`${this.apiUrl}/${forumId}/posts`, { content });
  }

  addReply(forumId: string, postIndex: number, content: string): Observable<Forum> {
    return this.http.post<Forum>(`${this.apiUrl}/${forumId}/posts/${postIndex}/replies`, { content });
  }

  addReplyToReply(forumId: string, postIndex: number, replyIndex: number, content: string): Observable<Forum> {
    return this.http.post<Forum>(`${this.apiUrl}/${forumId}/posts/${postIndex}/replies/${replyIndex}/replies`, { content });
  }

  react(forumId: string, postIndex: number): Observable<Forum> {
    return this.http.post<Forum>(`${this.apiUrl}/${forumId}/posts/${postIndex}/react`, {});
  }

  toggleLock(forumId: string, lock: boolean): Observable<Forum> {
    return this.http.post<Forum>(`${this.apiUrl}/${forumId}/${lock ? 'lock' : 'unlock'}`, {});
  }

  deleteForum(forumId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${forumId}`);
  }

  removePost(forumId: string, postIndex: number): Observable<Forum> {
    return this.http.delete<Forum>(`${this.apiUrl}/${forumId}/posts/${postIndex}`);
  }

  removeReply(forumId: string, postIndex: number, replyIndex: number): Observable<Forum> {
    return this.http.delete<Forum>(`${this.apiUrl}/${forumId}/posts/${postIndex}/replies/${replyIndex}`);
  }
}