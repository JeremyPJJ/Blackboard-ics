import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskService } from '@core/services/task.service';
import { NotificationService } from '@core/services/notification.service';
import { Task } from '@core/models';

export interface TaskEditDialogData {
  task: Task;
}

@Component({
  selector: 'app-task-edit-dialog',
  standalone: false,
  template: `
    <h2 mat-dialog-title>Editar Tarea</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="task-form">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Título</mat-label>
          <input matInput formControlName="title" placeholder="Ej: Tarea de anatomía - Semana 1">
          <mat-error *ngIf="form.get('title').hasError('required')">El título es obligatorio</mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" rows="4" placeholder="Descripción de la tarea..."></textarea>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="fill">
            <mat-label>Semana</mat-label>
            <input matInput type="number" formControlName="weekNumber" min="1">
            <mat-error *ngIf="form.get('weekNumber').hasError('required')">La semana es obligatoria</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Sesión</mat-label>
            <input matInput type="number" formControlName="sessionNumber" min="1">
            <mat-error *ngIf="form.get('sessionNumber').hasError('required')">La sesión es obligatoria</mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="fill">
            <mat-label>Fecha límite</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="deadline">
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="form.get('deadline').hasError('required')">La fecha límite es obligatoria</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Puntaje máximo</mat-label>
            <input matInput type="number" formControlName="maxScore" min="0">
            <mat-error *ngIf="form.get('maxScore').hasError('required')">El puntaje es obligatorio</mat-error>
          </mat-form-field>
        </div>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Tipo de calificación</mat-label>
          <mat-select formControlName="gradingType">
            <mat-option value="numerica">Numérica</mat-option>
            <mat-option value="cualitativa">Cualitativa</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || isSubmitting" (click)="onSubmit()">
        {{ isSubmitting ? 'Guardando...' : 'Guardar Cambios' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .task-form {
      min-width: 400px;
    }

    .full-width {
      width: 100%;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @media (max-width: 600px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TaskEditDialogComponent {
  form: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TaskEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskEditDialogData,
    private taskService: TaskService,
    private notificationService: NotificationService
  ) {
    const task = data.task;
    this.form = this.fb.group({
      title: [task.title, Validators.required],
      description: [task.description || ''],
      weekNumber: [task.weekNumber, [Validators.required, Validators.min(1)]],
      sessionNumber: [task.sessionNumber, [Validators.required, Validators.min(1)]],
      deadline: [task.deadline ? new Date(task.deadline) : null, Validators.required],
      maxScore: [task.maxScore, [Validators.required, Validators.min(0)]],
      gradingType: [task.gradingType || 'numerica', Validators.required]
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isSubmitting = true;
    const formData = this.form.value;

    this.taskService.updateTask(this.data.task._id, formData).subscribe({
      next: (task) => {
        this.dialogRef.close(task);
      },
      error: (error) => {
        console.error('Error updating task:', error);
        this.notificationService.error('Error al actualizar la tarea', 'Reintentar', () => this.onSubmit());
        this.isSubmitting = false;
      }
    });
  }
}
