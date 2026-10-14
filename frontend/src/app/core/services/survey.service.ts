import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SurveyQuestion {
  text: string;
  type: string; // texto | seleccion_unica | seleccion_multiple | escala
  options?: { text: string; value?: number }[];
  required?: boolean;
  minScale?: number;
  maxScale?: number;
}

export interface Survey {
  _id: string;
  title: string;
  description?: string;
  courseId?: string;
  type: string;
  targetRole: string;
  createdBy?: string;
  questions: SurveyQuestion[];
  startDate: Date;
  endDate: Date;
  isAnonymous: boolean;
  maxResponses?: number;
  responses: any[];
  isActive?: boolean;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class SurveyService {
  private apiUrl = '/api/surveys';

  constructor(private http: HttpClient) {}

  getSurveys(params?: any): Observable<Survey[]> {
    return this.http.get<Survey[]>(this.apiUrl, { params });
  }

  getSurvey(id: string): Observable<Survey> {
    return this.http.get<Survey>(`${this.apiUrl}/${id}`);
  }

  createSurvey(data: any): Observable<Survey> {
    return this.http.post<Survey>(this.apiUrl, data);
  }

  updateSurvey(id: string, data: any): Observable<Survey> {
    return this.http.patch<Survey>(`${this.apiUrl}/${id}`, data);
  }

  submitResponse(id: string, answers: any): Observable<Survey> {
    return this.http.post<Survey>(`${this.apiUrl}/${id}/responses`, { answers });
  }

  getStatistics(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/statistics`);
  }

  getResponses(id: string): Observable<Survey> {
    return this.http.get<Survey>(`${this.apiUrl}/${id}/responses`);
  }
}