import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AttendanceRegister } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private apiUrl = '/api/attendance';

  constructor(private http: HttpClient) {}

  create(courseId: string): Observable<AttendanceRegister> {
    return this.http.post<AttendanceRegister>(`${this.apiUrl}/course/${courseId}`, {});
  }

  findByCourse(courseId: string): Observable<AttendanceRegister> {
    return this.http.get<AttendanceRegister>(`${this.apiUrl}/course/${courseId}`);
  }

  addDate(
    registerId: string,
    date: Date,
    startTime: Date,
    endTime: Date,
    weekNumber: number,
    sessionNumber: number,
  ): Observable<AttendanceRegister> {
    return this.http.post<AttendanceRegister>(`${this.apiUrl}/${registerId}/dates`, {
      date,
      startTime,
      endTime,
      weekNumber,
      sessionNumber,
    });
  }

  markAttendance(
    registerId: string,
    dateIndex: number,
    studentId: string,
    status: string,
    reason?: string,
  ): Observable<AttendanceRegister> {
    return this.http.post<AttendanceRegister>(`${this.apiUrl}/mark`, {
      registerId,
      dateIndex,
      studentId,
      status,
      reason,
    });
  }

  modifyAttendance(
    registerId: string,
    dateIndex: number,
    studentId: string,
    status: string,
    reason?: string,
  ): Observable<AttendanceRegister> {
    return this.http.post<AttendanceRegister>(`${this.apiUrl}/modify`, {
      registerId,
      dateIndex,
      studentId,
      status,
      reason,
    });
  }

  getReport(courseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/report/${courseId}`);
  }

  getStudentSummary(studentId: string, courseIds: string[]): Observable<any> {
    const params = courseIds.length > 0 ? { courseIds: courseIds.join(',') } : {};
    return this.http.get(`${this.apiUrl}/student/${studentId}/summary`, { params });
  }
}
