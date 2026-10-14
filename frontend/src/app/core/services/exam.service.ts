import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Exam {
  _id: string;
  title: string;
  description?: string;
  courseId: string;
  weekNumber: number;
  sessionNumber: number;
  questions: any[];
  startDate?: Date;
  endDate?: Date;
  duration: number;
  maxAttempts: number;
  status: string;
  passingScore?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showResults?: boolean;
  showCorrectAnswers?: boolean;
  supervisionMessage?: string;
  attempts: any[];
  createdAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class ExamService {
  private apiUrl = '/api/exams';

  constructor(private http: HttpClient) {}

  getExamsByCourse(courseId: string): Observable<Exam[]> {
    return this.http.get<Exam[]>(`${this.apiUrl}/course/${courseId}`);
  }

  getExam(id: string): Observable<Exam> {
    return this.http.get<Exam>(`${this.apiUrl}/${id}`);
  }

  createExam(data: any): Observable<Exam> {
    return this.http.post<Exam>(this.apiUrl, data);
  }

  updateExam(id: string, data: any): Observable<Exam> {
    return this.http.patch<Exam>(`${this.apiUrl}/${id}`, data);
  }

  startExam(id: string): Observable<Exam> {
    return this.http.post<Exam>(`${this.apiUrl}/${id}/start`, {});
  }

  submitExam(id: string, answers: any): Observable<Exam> {
    return this.http.post<Exam>(`${this.apiUrl}/${id}/submit`, { answers });
  }

  reportSupervision(id: string, eventType: string, details?: string): Observable<Exam> {
    return this.http.post<Exam>(`${this.apiUrl}/${id}/supervision`, { eventType, details });
  }

  deleteExam(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  removeAttempt(id: string, studentId: string): Observable<Exam> {
    return this.http.delete<Exam>(`${this.apiUrl}/${id}/attempts/${studentId}`);
  }

  updateAttemptScore(id: string, studentId: string, score: number): Observable<Exam> {
    return this.http.patch<Exam>(`${this.apiUrl}/${id}/attempts/${studentId}`, { score });
  }
}