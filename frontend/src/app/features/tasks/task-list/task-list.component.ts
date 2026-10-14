import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TaskService } from '@core/services/task.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { Task } from '@core/models';
import { TaskCreateDialogComponent } from '../task-create-dialog/task-create-dialog.component';
import { TaskEditDialogComponent } from '../task-edit-dialog/task-edit-dialog.component';

@Component({
  selector: 'app-task-list',
  standalone: false,
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  isLoading = true;
  courseId: string;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private taskService: TaskService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {
    this.courseId = this.route.snapshot.paramMap.get('courseId') || '';
  }

  can(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByTaskId(index: number, task: Task): string {
    return task._id;
  }

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.isLoading = true;
    this.taskService.getTasksByCourse(this.courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tasks) => {
          this.tasks = tasks;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading tasks:', error);
          this.notificationService.error('Error al cargar las tareas');
          this.isLoading = false;
        },
      });
  }

  createTask() {
    const dialogRef = this.dialog.open(TaskCreateDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { courseId: this.courseId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTasks();
        this.notificationService.success('Tarea creada exitosamente');
      }
    });
  }

  editTask(task: Task) {
    const dialogRef = this.dialog.open(TaskEditDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { task: task }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTasks();
        this.notificationService.success('Tarea actualizada exitosamente');
      }
    });
  }

  deleteTask(taskId: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Tarea',
        message: '¿Está seguro de eliminar esta tarea?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.taskService.deleteTask(taskId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.tasks = this.tasks.filter(t => t._id !== taskId);
              this.notificationService.success('Tarea eliminada exitosamente');
            },
            error: (error) => {
              console.error('Error deleting task:', error);
              this.notificationService.error('Error al eliminar la tarea', 'Reintentar', () => this.deleteTask(taskId));
            },
          });
      }
    });
  }
}
