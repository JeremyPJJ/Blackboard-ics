import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { CourseService } from '@core/services/course.service';
import { NotificationService } from '@core/services/notification.service';
import { StatsService, CourseStats } from '@core/services/stats.service';
import { Course } from '@core/models';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: false,
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.scss']
})
export class TeacherDashboardComponent implements OnInit {
  myCourses: Course[] = [];
  totalStudents = 0;
  pendingReviews = 0;
  isLoading = true;
  hasError = false;

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private statsService: StatsService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  courseStats: CourseStats[] = [];

  get totalForums(): number {
    return this.courseStats.reduce((acc, cs) => acc + (cs.forumCount || 0), 0);
  }

  get totalExams(): number {
    return this.courseStats.reduce((acc, cs) => acc + (cs.examCount || 0), 0);
  }

  ngOnInit() {
    this.loadTeacherData();
    this.loadCourseStats();
  }

  loadCourseStats() {
    this.statsService.getMyCoursesStats().subscribe({
      next: (stats) => {
        this.courseStats = stats;
      },
      error: () => {},
    });
  }

  goToCourse(courseId: string) {
    this.router.navigate(['/courses', courseId]);
  }

  copyCode(code: string) {
    navigator.clipboard?.writeText(code).then(() => {
      this.notificationService.success('Código copiado: ' + code);
    }).catch(() => {
      this.notificationService.info('Código: ' + code);
    });
  }

  loadTeacherData() {
    this.isLoading = true;
    this.hasError = false;
    const user = this.authService.getCurrentUser();

    if (user) {
      this.courseService.getCourses({ teacherId: user._id }).subscribe({
        next: (courses) => {
          this.myCourses = courses;
          this.totalStudents = courses.reduce((acc, course) => acc + course.students.length, 0);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading courses:', error);
          this.notificationService.error('Error al cargar los cursos', 'Reintentar', () => this.loadTeacherData());
          this.hasError = true;
          this.isLoading = false;
        },
      });
    }
  }

  getTeacherName(course: Course): string {
    if (course.teachers.length === 0) return 'Sin asignar';
    return 'Docente'; // TODO: Resolver nombre desde UserService
  }
}
