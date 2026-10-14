import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TaskService } from '@core/services/task.service';
import { UserService } from '@core/services/user.service';
import { CourseService } from '@core/services/course.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { Task, TaskSubmission } from '@core/models';
import { TaskEditDialogComponent } from '../task-edit-dialog/task-edit-dialog.component';
import { GradeSubmissionDialogComponent } from '../grade-submission-dialog/grade-submission-dialog.component';
import { ViewSubmissionDialogComponent } from '../view-submission-dialog/view-submission-dialog.component';

@Component({
  selector: 'app-task-detail',
  standalone: false,
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss']
})
export class TaskDetailComponent implements OnInit, OnDestroy {
  task: Task | null = null;
  submissions: TaskSubmission[] = [];
  isLoading = true;
  taskId: string;
  private pollTimer: any = null;

  constructor(
    private route: ActivatedRoute,
    private taskService: TaskService,
    private userService: UserService,
    private courseService: CourseService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {
    this.taskId = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit() {
    this.loadTask();
    this.loadSubmissions();
    this.startPolling();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  private startPolling() {
    // Polling de entregas cada 8s (docente ve nuevas entregas sin recargar)
    this.pollTimer = setInterval(() => {
      if (this.isTeacherView) {
        this.loadSubmissions();
      }
    }, 8000);
  }

  private stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  get isTeacherView(): boolean {
    const role = this.authService.getCurrentUser()?.role;
    return role === 'docente' || role === 'super_admin' || role === 'unidad_academica';
  }

  loadTask() {
    this.isLoading = true;
    this.taskService.getTaskById(this.taskId).subscribe({
      next: (task) => {
        this.task = task;
        this.loadEnrolledStudents();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading task:', error);
        this.notificationService.error('Error al cargar la tarea');
        this.isLoading = false;
      },
    });
  }

  loadSubmissions() {
    this.taskService.getSubmissions(this.taskId).subscribe({
      next: (submissions) => {
        this.submissions = submissions;
        this.resolveStudentNames();
        this.recomputeNotSubmitted();
      },
      error: (error) => {
        console.error('Error loading submissions:', error);
        this.notificationService.error('Error al cargar las entregas');
      },
    });
  }

  // Mapa de studentId → { dni, name }
  studentMap: Record<string, { dni: string; name: string }> = {};

  private resolveStudentNames() {
    const ids = this.submissions.map(s => s.studentId?.toString());
    if (ids.length === 0) return;

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.studentMap = {};
        users.forEach(u => {
          if (ids.includes(u._id)) {
            this.studentMap[u._id] = {
              dni: u.dni,
              name: `${u.names} ${u.lastNames}`.trim(),
            };
          }
        });
      },
      error: (error) => console.error('Error loading students:', error),
    });
  }

  getStudentInfo(submission: TaskSubmission): { dni: string; name: string } {
    const info = this.studentMap[submission.studentId?.toString() || ''];
    return info || { dni: submission.studentId?.toString() || '', name: submission.studentId?.toString() || '' };
  }

  // Estudiantes inscritos y los que aún no entregaron
  enrolledStudents: { id: string; name: string; dni: string }[] = [];
  notSubmitted: { id: string; name: string; dni: string }[] = [];

  private loadEnrolledStudents() {
    if (!this.task) return;

    this.courseService.getCourseById(this.task.courseId).subscribe({
      next: (course) => {
        const studentIds = course.students.map((s: any) => s.userId?.toString());
        this.userService.getUsers().subscribe({
          next: (users) => {
            this.enrolledStudents = users
              .filter(u => studentIds.includes(u._id))
              .map(u => ({ id: u._id, name: `${u.names} ${u.lastNames}`.trim(), dni: u.dni }));
            this.recomputeNotSubmitted();
          },
          error: () => {},
        });
      },
      error: () => {},
    });
  }

  private recomputeNotSubmitted() {
    const submittedIds = this.submissions.map(s => s.studentId?.toString());
    this.notSubmitted = this.enrolledStudents.filter(s => !submittedIds.includes(s.id));
  }

  viewSubmission(submission: TaskSubmission) {
    const info = this.getStudentInfo(submission);
    this.dialog.open(ViewSubmissionDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { submission: submission, studentDni: info.dni, studentName: info.name }
    });
  }

  gradeSubmission(submission: TaskSubmission) {
    const dialogRef = this.dialog.open(GradeSubmissionDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { 
        submission: submission,
        maxScore: this.task?.maxScore || 100
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSubmissions();
        this.notificationService.success('Calificación guardada exitosamente');
      }
    });
  }

  editTask() {
    if (!this.task) return;

    const dialogRef = this.dialog.open(TaskEditDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { task: this.task }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTask();
        this.notificationService.success('Tarea actualizada exitosamente');
      }
    });
  }

  removeSubmission(submission: TaskSubmission) {
    const info = this.getStudentInfo(submission);
    if (!confirm(`¿Eliminar la entrega de ${info.name}? El estudiante podrá volver a entregar.`)) return;

    this.taskService.removeSubmission(submission._id).subscribe({
      next: () => {
        this.loadSubmissions();
        this.notificationService.success('Entrega eliminada');
      },
      error: (error) => this.notificationService.error(error.error?.message || 'Error al eliminar la entrega'),
    });
  }
}
