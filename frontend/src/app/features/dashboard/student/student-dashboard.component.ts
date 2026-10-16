import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '@core/services/auth.service';
import { CourseService } from '@core/services/course.service';
import { UserService } from '@core/services/user.service';
import { TaskService } from '@core/services/task.service';
import { AttendanceService } from '@core/services/attendance.service';
import { NotificationService } from '@core/services/notification.service';
import { Course } from '@core/models';
import { JoinResultDialogComponent } from './join-result-dialog.component';
import { MyGradesDialogComponent } from './my-grades-dialog.component';

@Component({
  selector: 'app-student-dashboard',
  standalone: false,
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss']
})
export class StudentDashboardComponent implements OnInit {
  myCourses: Course[] = [];
  pendingTasks = 0;
  isLoading = true;
  hasError = false;
  showJoinForm = false;
  invitationCode = '';
  joinError = '';

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private userService: UserService,
    private taskService: TaskService,
    private attendanceService: AttendanceService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private router: Router,
  ) {}

attendanceCounts = { present: 0, absent: 0, late: 0, justified: 0 };
  courseAttendance: { courseName: string; present: number; absent: number; late: number; justified: number }[] = [];

  get userCareer(): string {
    const u = this.authService.getCurrentUser();
    return u?.tags?.[0] || '';
  }

  ngOnInit() {
    this.loadStudentData();
    this.loadTeacherNames();
  }

  loadStudentData() {
    this.isLoading = true;
    this.hasError = false;
    const user = this.authService.getCurrentUser();

    if (user) {
      this.courseService.getCourses({ studentId: user._id }).subscribe({
        next: (courses) => {
          this.myCourses = courses;
          this.isLoading = false;
          this.loadPendingTasks(courses, user._id);
          this.loadAttendanceSummary(courses, user._id);
        },
        error: (error) => {
          console.error('Error loading courses:', error);
          this.notificationService.error('Error al cargar los cursos', 'Reintentar', () => this.loadStudentData());
          this.hasError = true;
          this.isLoading = false;
        },
      });
    }
  }

  private loadAttendanceSummary(courses: Course[], studentId: string) {
    this.attendanceCounts = { present: 0, absent: 0, late: 0, justified: 0 };
    this.courseAttendance = [];

    if (courses.length === 0) return;

    this.attendanceService.getStudentSummary(
      studentId,
      courses.map(c => c._id)
    ).subscribe({
      next: (data) => {
        this.attendanceCounts = data.totals || { present: 0, absent: 0, late: 0, justified: 0 };
        const byId = data.perCourse || {};
        this.courseAttendance = courses
          .filter(c => byId[c._id])
          .map(c => ({
            courseName: c.name,
            ...byId[c._id],
          }));
      },
      error: (error) => {
        console.error('Error loading attendance summary:', error);
      },
    });
  }

  private loadPendingTasks(courses: Course[], studentId: string) {
    let tasks: any[] = [];
    let coursesLoaded = 0;

    if (courses.length === 0) {
      this.pendingTasks = 0;
      return;
    }

    courses.forEach(course => {
      this.taskService.getTasksByCourse(course._id).subscribe({
        next: (courseTasks) => {
          tasks = tasks.concat(courseTasks);
          coursesLoaded++;
          if (coursesLoaded === courses.length) {
            this.countPending(tasks, studentId);
          }
        },
        error: () => {
          coursesLoaded++;
          if (coursesLoaded === courses.length) {
            this.countPending(tasks, studentId);
          }
        },
      });
    });
  }

  private countPending(tasks: any[], studentId: string) {
    if (tasks.length === 0) {
      this.pendingTasks = 0;
      return;
    }

    let pending = 0;
    let checked = 0;

    tasks.forEach(task => {
      this.taskService.getSubmissions(task._id).subscribe({
        next: (submissions) => {
          const mine = submissions.find(s => s.studentId?.toString() === studentId);
          if (!mine) {
            pending++;
          }
          checked++;
          if (checked === tasks.length) {
            this.pendingTasks = pending;
          }
        },
        error: () => {
          pending++;
          checked++;
          if (checked === tasks.length) {
            this.pendingTasks = pending;
          }
        },
      });
    });
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

  private loadTeacherNames() {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.teacherNameMap = new Map(
          users.map(u => [u._id, `${u.names} ${u.lastNames}`.trim()])
        );
      },
      error: () => {},
    });
  }

  goToMyTasks() {
    this.router.navigate(['/my-tasks']);
  }

  openMyGrades() {
    this.dialog.open(MyGradesDialogComponent, {
      width: '640px',
      maxWidth: '94vw',
    });
  }

  showJoinDialog() {
    this.showJoinForm = true;
    this.joinError = '';
  }

  joinCourse() {
    if (!this.invitationCode) return;

    this.courseService.joinByCode(this.invitationCode).subscribe({
      next: (course) => {
        this.myCourses.push(course);
        this.showJoinForm = false;
        this.invitationCode = '';
        this.joinError = '';
        this.dialog.open(JoinResultDialogComponent, {
          width: '420px',
          maxWidth: '90vw',
          data: {
            success: true,
            message: 'Te has unido al curso exitosamente.',
            courseName: course.name,
            code: course.invitationConfig?.code,
          },
        });
        this.loadPendingTasks(this.myCourses, this.authService.getCurrentUser()?._id || '');
        this.loadAttendanceSummary(this.myCourses, this.authService.getCurrentUser()?._id || '');
      },
      error: (error) => {
        console.error('Error joining course:', error);
        let success = false;
        let message = 'Error al unirse al curso';
        if (error.status === 409) {
          message = `Ya estás unido a este curso (código "${this.invitationCode}")`;
        } else if (error.status === 404) {
          message = 'El código es incorrecto. Verificá que lo escribiste bien.';
        } else {
          message = error.error?.message || 'Error al unirse al curso';
        }
        this.joinError = message;
        this.dialog.open(JoinResultDialogComponent, {
          width: '420px',
          maxWidth: '90vw',
          data: { success, message },
        });
      },
    });
  }
}
