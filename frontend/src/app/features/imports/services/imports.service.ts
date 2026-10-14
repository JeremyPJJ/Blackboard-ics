import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ImportConfirmResponse, ImportSummary } from '../models/import.model';

/**
 * Acceso REST a los endpoints de importación masiva de participantes
 * (Spec: Bulk Import). El preview también se calcula localmente con `xlsx`
 * para feedback inmediato; el servidor es la fuente autoritativa.
 */
@Injectable({
  providedIn: 'root',
})
export class ImportsService {
  private apiUrl = '/api/import';

  constructor(private http: HttpClient) {}

  previewParticipants(file: File, courseId: string): Observable<ImportSummary> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseId', courseId);
    return this.http.post<ImportSummary>(`${this.apiUrl}/participants/preview`, formData);
  }

  confirmImport(file: File, courseId: string): Observable<ImportConfirmResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseId', courseId);
    return this.http.post<ImportConfirmResponse>(`${this.apiUrl}/participants/confirm`, formData);
  }
}