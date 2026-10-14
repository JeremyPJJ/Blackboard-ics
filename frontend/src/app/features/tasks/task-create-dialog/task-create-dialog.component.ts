import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskService } from '@core/services/task.service';
import { NotificationService } from '@core/services/notification.service';
import { TaskStatus, GradingType } from '@core/models';

export interface TaskCreateDialogData {
  courseId: string;
  weekNumber?: number;
}

/**
 * Dialog de creación de tareas (Spec: Task Creation — auto semana/sesión).
 *
 * La semana se toma del contexto de la sección del curso (vía `openTaskCreate(wi)`
 * en course-detail) con fallback a 1; `sessionNumber` queda fijo en 1. No hay
 * inputs de semana/sesión en el formulario: el banner informa la semana destino.
 */
@Component({
  selector: 'app-task-create-dialog',
  standalone: false,
  templateUrl: './task-create-dialog.component.html',
  styleUrls: ['./task-create-dialog.component.scss'],
})
export class TaskCreateDialogComponent {
  form: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TaskCreateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskCreateDialogData,
    private taskService: TaskService,
    private notificationService: NotificationService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      allowedTypes: [['archivo', 'foto', 'texto']],
      maxFiles: [1, [Validators.required, Validators.min(1)]],
      deadline: [null, Validators.required],
      maxScore: [100, [Validators.required, Validators.min(0)]],
      gradingType: ['manual', Validators.required]
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isSubmitting = true;
    const raw = this.form.value;

    const payload = {
      title: raw.title,
      description: raw.description || '',
      courseId: this.data.courseId,
      weekNumber: Number(this.data.weekNumber || 1),
      sessionNumber: 1,
      deadline: raw.deadline ? new Date(raw.deadline) : undefined,
      noDeadline: !raw.deadline,
      allowedTypes: raw.allowedTypes?.length ? raw.allowedTypes : ['archivo'],
      maxFileSize: 10 * 1024 * 1024,
      maxFiles: Number(raw.maxFiles) || 1,
      status: TaskStatus.PUBLICADA,
      gradingType: raw.gradingType as GradingType,
      maxScore: Number(raw.maxScore),
    };

    this.taskService.createTask(payload).subscribe({
      next: (task) => {
        this.dialogRef.close(task);
      },
      error: (error) => {
        console.error('Error creating task:', error);
        this.notificationService.error('Error al crear la tarea', 'Reintentar', () => this.onSubmit());
        this.isSubmitting = false;
      }
    });
  }
}