import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course } from '../models';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private apiUrl = '/api/courses';

  constructor(private http: HttpClient) {}

  getCourses(filters?: { career?: string; status?: string; teacherId?: string; studentId?: string; search?: string; year?: string; semester?: string }): Observable<Course[]> {
    let params = new HttpParams();

    if (filters?.career) {
      params = params.set('career', filters.career);
    }

    if (filters?.status) {
      params = params.set('status', filters.status);
    }

    if (filters?.teacherId) {
      params = params.set('teacherId', filters.teacherId);
    }

    if (filters?.studentId) {
      params = params.set('studentId', filters.studentId);
    }

    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    if (filters?.year) {
      params = params.set('year', filters.year);
    }

    if (filters?.semester) {
      params = params.set('semester', filters.semester);
    }

    return this.http.get<Course[]>(this.apiUrl, { params });
  }

  getCourseById(id: string): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/${id}`);
  }

  createCourse(course: Partial<Course>): Observable<Course> {
    return this.http.post<Course>(this.apiUrl, course);
  }

  updateCourse(id: string, course: Partial<Course>): Observable<Course> {
    return this.http.patch<Course>(`${this.apiUrl}/${id}`, course);
  }

  deleteCourse(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  deleteCoursePermanent(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/permanent`);
  }

  restoreCourse(id: string): Observable<Course> {
    return this.http.post<Course>(`${this.apiUrl}/${id}/restore`, {});
  }

  joinByCode(code: string): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/join/${code}`);
  }

  addParticipant(courseId: string, userId: string, role: 'teacher' | 'student'): Observable<Course> {
    return this.http.post<Course>(`${this.apiUrl}/${courseId}/participants`, { userId, role });
  }

  removeParticipant(courseId: string, userId: string, role: 'teacher' | 'student'): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${courseId}/participants/${userId}`, {
      params: new HttpParams().set('role', role),
    });
  }

  updateCourseStatus(id: string, status: string): Observable<Course> {
    return this.http.patch<Course>(`${this.apiUrl}/${id}/status`, { status });
  }
}
