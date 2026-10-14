import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FileService } from '@core/services/file.service';
import { TaskSubmission } from '@core/models';

export interface ViewSubmissionDialogData {
  submission: TaskSubmission;
  studentDni?: string;
  studentName?: string;
}

@Component({
  selector: 'app-view-submission-dialog',
  standalone: false,
  template: `
    <h2 mat-dialog-title>Detalle de Entrega</h2>
    <mat-dialog-content>
      <div class="submission-detail">
        <div class="info-row">
          <strong>Estudiante:</strong>
          <span>{{ data.studentName || data.submission.studentId }}</span>
        </div>

        <div class="info-row">
          <strong>DNI:</strong>
          <span>{{ data.studentDni || '—' }}</span>
        </div>

        <div class="info-row">
          <strong>Fecha de entrega:</strong>
          <span>{{ data.submission.submittedAt | date:'fullDate' }}</span>
        </div>

        <div class="info-row" *ngIf="data.submission.score !== undefined && data.submission.score !== null">
          <strong>Calificación:</strong>
          <span class="score">{{ data.submission.score }}</span>
        </div>

        <div class="info-row" *ngIf="data.submission.feedback">
          <strong>Retroalimentación:</strong>
          <span>{{ data.submission.feedback }}</span>
        </div>

        <div class="info-row" *ngIf="data.submission.comments">
          <strong>Texto / comentario del estudiante:</strong>
          <span class="submission-text">{{ data.submission.comments }}</span>
        </div>

        <div class="file-section" *ngIf="data.submission.fileIds?.length > 0">
          <strong>Archivos adjuntos:</strong>
          <ul class="file-list">
            <li *ngFor="let fileId of data.submission.fileIds; let fi = index">
              <button mat-stroked-button color="primary" class="file-download-btn" (click)="downloadFile(fileId, fi)">
                <mat-icon>download</mat-icon> Ver / descargar archivo {{ data.submission.fileIds.length > 1 ? fi + 1 : '' }}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .submission-detail { min-width: 400px; }

    .info-row {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--color-gray);

      strong { color: var(--color-text-light); font-size: 0.875rem; }
    }

    .score { font-weight: 600; color: var(--color-primary); font-size: 1.1rem; }

    .submission-text {
      white-space: pre-wrap;
      color: var(--color-gray-dark);
      line-height: 1.6;
    }

    .file-section { padding: 1rem 0; }

    .file-list { list-style: none; margin: 0.5rem 0 0; padding: 0; display: grid; gap: 0.5rem; }

    .file-download-btn {
      font-size: 0.875rem;

      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    @media (max-width: 600px) {
      .info-row { grid-template-columns: 1fr; gap: 0.25rem; }
    }
  `]
})
export class ViewSubmissionDialogComponent {
  constructor(
    public fileService: FileService,
    @Inject(MAT_DIALOG_DATA) public data: ViewSubmissionDialogData
  ) {}

  downloadFile(fileId: string, index: number): void {
    const student = this.data.studentName || 'entrega';
    this.fileService.download(fileId, `${student}_archivo_${index + 1}`);
  }
}