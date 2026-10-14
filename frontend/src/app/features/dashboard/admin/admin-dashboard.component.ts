import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { CourseService } from '@core/services/course.service';
import { NotificationService } from '@core/services/notification.service';
import { StatsService, TeacherStats } from '@core/services/stats.service';
import { Course } from '@core/models';
import { TeacherStatsDialogComponent } from './teacher-stats-dialog.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  totalUsers = 0;
  totalTeachers = 0;
  totalStudents = 0;
  activeCourses = 0;
  courses: Course[] = [];
  isLoading = true;
  hasError = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private courseService: CourseService,
    private statsService: StatsService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private router: Router,
  ) {}

  teacherStats: TeacherStats[] = [];
  viewMode: 'cifras' | 'graficos' = 'cifras';
  showAllTeachers = false;

  get roleLabel(): string {
    const role = this.authService.getCurrentUser()?.role;
    const labels: Record<string, string> = {
      super_admin: 'Administrador', unidad_academica: 'Unidad Académica',
      secretaria: 'Secretaría', soporte: 'Soporte Técnico',
    };
    return labels[role || ''] || 'Administrador';
  }

  ngOnInit() {
    this.loadDashboardData();
    this.loadTeacherStats();
  }

  loadTeacherStats() {
    this.statsService.getTeacherSummary().subscribe({
      next: (stats) => {
        this.teacherStats = stats;
      },
      error: () => {},
    });
  }

  openTeacherDetail(teacher: TeacherStats) {
    this.statsService.getTeacherCourses(teacher.teacherId).subscribe({
      next: (courses) => {
        this.dialog.open(TeacherStatsDialogComponent, {
          width: '560px',
          maxWidth: '92vw',
          data: { teacher, courses },
        });
      },
      error: () => {},
    });
  }

  goToCourse(courseId: string) {
    this.router.navigate(['/courses', courseId]);
  }

  get visibleTeachers(): TeacherStats[] {
    if (this.showAllTeachers) return this.teacherStats;
    return this.teacherStats.slice(0, 4);
  }

  getTeacherName(course: Course): string {
    const seen = new Set<string>();
    const names = (course.teachers || [])
      .map(t => {
        const key = t.userId?.toString();
        if (!key || seen.has(key)) return null;
        seen.add(key);
        return this.teacherNameMap.get(key);
      })
      .filter((n): n is string => !!n);
    return names.length > 0 ? names.join(', ') : 'Sin asignar';
  }

  private teacherNameMap = new Map<string, string>();

  chartMax(): number {
    let max = 1;
    this.teacherStats.forEach(t => {
      max = Math.max(max, t.courseCount, t.sessionCount, t.taskCount, t.materialCount, t.attendanceCount, t.forumCount || 0, t.examCount || 0);
    });
    return max;
  }

  barWidth(value: number): string {
    const pct = Math.round((value / this.chartMax()) * 100);
    return pct + '%';
  }

  loadDashboardData() {
    this.isLoading = true;
    this.hasError = false;

    forkJoin({
      users: this.userService.getUsers(),
      courses: this.courseService.getCourses({ status: 'activo' })
    }).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ({ users, courses }) => {
        this.totalUsers = users.length;
        this.totalTeachers = users.filter(u => u.role === 'docente').length;
        this.totalStudents = users.filter(u => u.role === 'estudiante').length;
        this.courses = courses;
        this.activeCourses = courses.length;
        this.teacherNameMap = new Map(
          users.map(u => [u._id, `${u.names} ${u.lastNames}`.trim()])
        );
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.notificationService.error('Error al cargar los datos del dashboard', 'Reintentar', () => this.loadDashboardData());
        this.hasError = true;
      }
    });
  }
}
