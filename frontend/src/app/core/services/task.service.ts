import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, TaskSubmission } from '../models';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = '/api/tasks';

  constructor(private http: HttpClient) {}

  getTasksByCourse(courseId: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/course/${courseId}`);
  }

  getTaskById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  createTask(task: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  updateTask(id: string, task: Partial<Task>): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${id}`, task);
  }

  deleteTask(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  submitTask(taskId: string, fileIds: string[], comments?: string, lateReason?: string): Observable<TaskSubmission> {
    return this.http.post<TaskSubmission>(`${this.apiUrl}/submit`, {
      taskId,
      fileIds,
      comments,
      lateReason,
    });
  }

  getSubmissions(taskId: string): Observable<TaskSubmission[]> {
    return this.http.get<TaskSubmission[]>(`${this.apiUrl}/${taskId}/submissions`);
  }

  gradeSubmission(taskId: string, submissionId: string, score: number, feedback: string): Observable<TaskSubmission> {
    return this.http.post<TaskSubmission>(`${this.apiUrl}/${taskId}/grade`, {
      submissionId,
      score,
      feedback,
    });
  }

  publishSubmission(taskId: string, submissionId: string): Observable<TaskSubmission> {
    return this.http.post<TaskSubmission>(`${this.apiUrl}/${taskId}/publish`, { submissionId });
  }

  removeSubmission(submissionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/submissions/${submissionId}`);
  }
}
