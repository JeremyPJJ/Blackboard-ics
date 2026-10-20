import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface MaterialEditDialogData {
  title: string;
  description: string;
  type?: string;
  url?: string;
}

export interface MaterialEditResult {
  title: string;
  description: string;
  type: string;
  url?: string;
  file?: File;
}

@Component({
  selector: 'app-material-edit-dialog',
  standalone: false,
  template: `
    <h2 mat-dialog-title>Editar Material</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Tipo</mat-label>
        <mat-select [(ngModel)]="type" name="type">
          <mat-option value="pdf">PDF</mat-option>
          <mat-option value="doc">Documento</mat-option>
          <mat-option value="link">Enlace</mat-option>
          <mat-option value="video">Video</mat-option>
          <mat-option value="foto">Imagen</mat-option>
          <mat-option value="texto">Texto</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Título</mat-label>
        <input matInput [(ngModel)]="title" name="title" placeholder="Título del material" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Descripción</mat-label>
        <input matInput [(ngModel)]="description" name="description" placeholder="Breve descripción (opcional)" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width" *ngIf="type === 'link' || type === 'video'">
        <mat-label>URL</mat-label>
        <input matInput [(ngModel)]="url" name="url" placeholder="https://..." />
      </mat-form-field>
      <div class="file-upload" *ngIf="type !== 'link' && type !== 'video'">
        <input #fileInput type="file" id="matEditFile" class="file-input"
               accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.txt"
               (change)="onFileSelected($event)" />
        <label for="matEditFile" class="btn btn-outline">
          <mat-icon>attach_file</mat-icon>
          {{ file ? file.name : 'Reemplazar archivo (opcional)' }}
        </label>
        <button *ngIf="file" mat-icon-button color="warn" type="button" (click)="file = null; fileInput.value = ''" aria-label="Quitar archivo">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="!title" (click)="save()">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 0.5rem; }
    .file-upload { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
    .file-upload .btn { height: 48px; margin: 0; display: inline-flex; align-items: center; justify-content: center; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .file-input { display: none; }
  `]
})
export class MaterialEditDialogComponent {
  title: string;
  description: string;
  type: string;
  url: string;
  file: File | null = null;
  private closing = false;

  constructor(
    private dialogRef: MatDialogRef<MaterialEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: MaterialEditDialogData,
  ) {
    this.title = data.title;
    this.description = data.description || '';
    this.type = data.type || 'pdf';
    this.url = data.url || '';
  }

  onFileSelected(event: any) {
    const f = event.target.files?.[0];
    this.file = f || null;
  }

  save(): void {
    if (this.closing || !this.title) return;
    this.closing = true;
    const result: MaterialEditResult = {
      title: this.title.trim(),
      description: this.description,
      type: this.type,
      url: this.url || undefined,
      file: this.file || undefined,
    };
    this.dialogRef.close(result);
  }
}