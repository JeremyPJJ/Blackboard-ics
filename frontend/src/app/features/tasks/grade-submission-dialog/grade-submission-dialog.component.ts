import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskService } from '@core/services/task.service';
import { NotificationService } from '@core/services/notification.service';
import { TaskSubmission } from '@core/models';

export interface GradeSubmissionDialogData {
  submission: TaskSubmission;
  maxScore: number;
}

@Component({
  selector: 'app-grade-submission-dialog',
  standalone: false,
  template: `
    <h2 mat-dialog-title>Calificar Entrega</h2>
    <mat-dialog-content>
      <div class="submission-info">
        <p><strong>Estudiante ID:</strong> {{ data.submission.studentId }}</p>
        <p><strong>Entregado:</strong> {{ data.submission.submittedAt | date:'short' }}</p>
        <p *ngIf="data.submission.comments"><strong>Comentarios:</strong> {{ data.submission.comments }}</p>
        <p *ngIf="data.submission.fileIds?.length > 0">
          <strong>Archivos:</strong> {{ data.submission.fileIds.length }} archivo(s)
        </p>
      </div>

      <form [formGroup]="form" class="grade-form">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Puntaje (0 - {{ data.maxScore }})</mat-label>
          <input matInput type="number" formControlName="score" [min]="0" [max]="data.maxScore">
          <mat-error *ngIf="form.get('score').hasError('required')">El puntaje es obligatorio</mat-error>
          <mat-error *ngIf="form.get('score').hasError('min')">El puntaje no puede ser negativo</mat-error>
          <mat-error *ngIf="form.get('score').hasError('max')">El puntaje no puede exceder {{ data.maxScore }}</mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Retroalimentación</mat-label>
          <textarea matInput formControlName="feedback" rows="4" placeholder="Comentarios sobre la entrega..."></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || isSubmitting" (click)="onSubmit()">
        {{ isSubmitting ? 'Guardando...' : 'Guardar Calificación' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .submission-info {
      background: var(--color-gray);
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1.5rem;

      p {
        margin: 0.5rem 0;
      }
    }

    .file-link {
      color: var(--color-accent);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .grade-form {
      min-width: 400px;
    }

    .full-width {
      width: 100%;
    }
  `]
})
export class GradeSubmissionDialogComponent {
  form: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<GradeSubmissionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GradeSubmissionDialogData,
    private taskService: TaskService,
    private notificationService: NotificationService
  ) {
    this.form = this.fb.group({
      score: [null, [Validators.required, Validators.min(0), Validators.max(data.maxScore)]],
      feedback: ['']
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isSubmitting = true;
    const formData = this.form.value;

    this.taskService.gradeSubmission(
      this.data.submission.taskId,
      this.data.submission._id,
      formData.score,
      formData.feedback || ''
    ).subscribe({
      next: (submission) => {
        this.dialogRef.close(submission);
      },
      error: (error) => {
        console.error('Error grading submission:', error);
        this.notificationService.error('Error al calificar la entrega', 'Reintentar', () => this.onSubmit());
        this.isSubmitting = false;
      }
    });
  }
}
