import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApplicationStatus,
  Job,
  JobPayload,
} from '../models/job.model';

/**
 * Acceso REST a los endpoints de ofertas laborales
 * (Spec: Job Offers — todos bajo el namespace de permisos `ofertas.*`).
 */
@Injectable({
  providedIn: 'root',
})
export class JobsService {
  private apiUrl = '/api/jobs';

  constructor(private http: HttpClient) {}

  getJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(this.apiUrl);
  }

  getJobById(id: string): Observable<Job> {
    return this.http.get<Job>(`${this.apiUrl}/${id}`);
  }

  createJob(payload: JobPayload): Observable<Job> {
    return this.http.post<Job>(this.apiUrl, payload);
  }

  updateJob(id: string, payload: Partial<JobPayload>): Observable<Job> {
    return this.http.patch<Job>(`${this.apiUrl}/${id}`, payload);
  }

  closeJob(id: string): Observable<Job> {
    return this.http.patch<Job>(`${this.apiUrl}/${id}`, { status: 'cerrada' });
  }

  deleteJob(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Postula a una oferta (R6-5: CV adjunto opcional).
   * `attachments` es aditivo y retrocompatible: sin adjuntos el body se envía
   * como `{ coverLetter }` (comportamiento previo intacto).
   */
  applyToJob(id: string, coverLetter: string, attachments: string[] = []): Observable<Job> {
    const body: { coverLetter: string; attachments?: string[] } = { coverLetter };
    if (attachments.length > 0) {
      body.attachments = attachments;
    }
    return this.http.post<Job>(`${this.apiUrl}/${id}/apply`, body);
  }

  updateApplicationStatus(
    id: string,
    applicationIndex: number,
    status: ApplicationStatus,
  ): Observable<Job> {
    return this.http.patch<Job>(
      `${this.apiUrl}/${id}/applications/${applicationIndex}/status`,
      { status },
    );
  }
}
