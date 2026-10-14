import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface JoinResultData {
  success: boolean;
  message: string;
  courseName?: string;
  code?: string;
}

@Component({
  selector: 'app-join-result-dialog',
  standalone: false,
  template: `
    <h2 mat-dialog-title>{{ data.success ? '¡Te has unido!' : 'No se pudo unir' }}</h2>
    <mat-dialog-content class="content">
      <mat-icon class="icon" [class.ok]="data.success" [class.err]="!data.success">
        {{ data.success ? 'check_circle' : 'error_outline' }}
      </mat-icon>
      <p class="msg">{{ data.message }}</p>
      <div class="course-info" *ngIf="data.success && data.courseName">
        <strong>{{ data.courseName }}</strong>
        <span>Código: {{ data.code }}</span>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" mat-dialog-close>{{ data.success ? 'Entendido' : 'Reintentar' }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .content { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 1rem 0; text-align: center; }
    .icon { font-size: 56px; width: 56px; height: 56px; }
    .icon.ok { color: #28a745; }
    .icon.err { color: #dc3545; }
    .msg { margin: 0; color: var(--color-gray-dark); }
    .course-info { display: flex; flex-direction: column; color: var(--color-text-light); font-size: 0.875rem; }
  `]
})
export class JoinResultDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<JoinResultDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: JoinResultData,
  ) {}
}