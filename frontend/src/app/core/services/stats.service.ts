import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TeacherStats {
  teacherId: string;
  name: string;
  email: string;
  courseCount: number;
  sessionCount: number;
  materialCount: number;
  taskCount: number;
  attendanceCount: number;
  forumCount: number;
  examCount: number;
}

export interface CourseStats {
  courseId: string;
  name: string;
  code: string;
  status: string;
  invitationCode: string;
  sessionCount: number;
  materialCount: number;
  taskCount: number;
  attendanceCount: number;
  forumCount: number;
  examCount: number;
  studentCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  private apiUrl = '/api/stats';

  constructor(private http: HttpClient) {}

  getTeacherSummary(): Observable<TeacherStats[]> {
    return this.http.get<TeacherStats[]>(`${this.apiUrl}/teachers`);
  }

  getTeacherCourses(teacherId: string): Observable<CourseStats[]> {
    return this.http.get<CourseStats[]>(`${this.apiUrl}/teacher/${teacherId}/courses`);
  }

  getMyCoursesStats(): Observable<CourseStats[]> {
    return this.http.get<CourseStats[]>(`${this.apiUrl}/my-courses`);
  }
}