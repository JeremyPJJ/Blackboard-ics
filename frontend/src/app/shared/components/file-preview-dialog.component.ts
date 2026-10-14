import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';
import { FileService } from '@core/services/file.service';

export interface FilePreviewData {
  fileId: string;
  title: string;
}

@Component({
  selector: 'app-file-preview-dialog',
  standalone: false,
  template: `
    <h2 mat-dialog-title>
      <span class="dialog-title-text">{{ data.title }}</span>
      <span class="zoom-controls" *ngIf="kind === 'pdf' || kind === 'image' || kind === 'video' || kind === 'word' || kind === 'excel'">
        <button mat-icon-button (click)="zoomOut()" aria-label="Alejar" [disabled]="zoom <= 0.5"><mat-icon>remove</mat-icon></button>
        <span class="zoom-value">{{ zoom * 100 | number:'1.0-0' }}%</span>
        <button mat-icon-button (click)="zoomIn()" aria-label="Acercar" [disabled]="zoom >= 2.5"><mat-icon>add</mat-icon></button>
        <button mat-button (click)="zoom = 1">100%</button>
      </span>
    </h2>
    <mat-dialog-content class="preview-content">
      <div class="preview-box" [class.zoomable]="kind === 'pdf' || kind === 'image' || kind === 'video'">
        <div class="zoom-stage" [style.transform]="kind === 'pdf' || kind === 'image' || kind === 'video' ? 'scale(' + zoom + ')' : null">
          <iframe *ngIf="kind === 'pdf'" [src]="trustedUrl" class="preview-frame"></iframe>
          <img *ngIf="kind === 'image'" [src]="blobUrl" class="preview-img" alt="Vista previa" />
          <video *ngIf="kind === 'video'" [src]="blobUrl" class="preview-video" controls></video>
        </div>
        <pre *ngIf="kind === 'text'" class="preview-text" [style.fontSize.px]="zoom * 14">{{ textContent }}</pre>
        <div *ngIf="kind === 'word'" #wordContainer class="word-container" [style.fontSize.px]="zoom * 16"></div>
        <div *ngIf="kind === 'excel'" #excelContainer class="excel-container" [style.fontSize.px]="zoom * 14"></div>
        <div *ngIf="kind === 'ppt'" class="ppt-note">
          <mat-icon>slideshow</mat-icon>
          <p>PowerPoint no se puede renderizar en el navegador. Descargá el archivo para verlo.</p>
        </div>
        <div *ngIf="!blobUrl && kind !== 'word' && kind !== 'excel' && kind !== 'ppt'" class="preview-loading">Cargando archivo...</div>
      </div>
      <p *ngIf="kind === 'ppt'" class="office-note">Usá el botón descargar para abrirlo en PowerPoint.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button color="primary" (click)="download()">
        <mat-icon>download</mat-icon> Descargar
      </button>
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 0; }
    h2[mat-dialog-title] { display: flex; flex: 0 0 auto; align-items: center; gap: 1rem; margin: 0; padding: 0.75rem 1.25rem; }
    .dialog-title-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .zoom-controls { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 0.25rem; margin-left: auto; }
    .zoom-value { font-size: 0.8125rem; color: var(--color-text-light); min-width: 42px; text-align: center; }
    .preview-content { flex: 1 1 auto; width: 100%; min-width: 0; min-height: 0; max-width: none; max-height: none; padding: 0 1rem; }
    .preview-box { display: grid; place-items: center; width: 100%; height: 100%; min-height: 0; background: #f8fafc; border: 1px solid #e3e8ef; border-radius: 8px; overflow: auto; }
    .preview-box.zoomable { overflow: auto; }
    .zoom-stage { display: flex; justify-content: center; width: 100%; height: 100%; min-height: 0; transform-origin: top center; }
    .preview-frame { width: 100%; height: 100%; min-height: 0; border: none; }
    .preview-img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .preview-video { width: 100%; height: 100%; object-fit: contain; }
    .preview-text { width: 100%; height: 100%; overflow: auto; padding: 1rem; font-size: 0.875rem; white-space: pre-wrap; }
    .preview-loading { color: var(--color-text-light); }
    .office-note { color: var(--color-text-light); font-size: 0.8125rem; margin-top: 0.75rem; }
    .word-container { width: 100%; height: 100%; overflow: auto; background: #fff; padding: 1rem; }
    .excel-container { width: 100%; height: 100%; overflow: auto; background: #fff; }
    .excel-container table { border-collapse: collapse; font-size: 0.8125rem; }
    .excel-container td, .excel-container th { border: 1px solid #d1d5db; padding: 0.25rem 0.5rem; }
    .ppt-note { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: var(--color-text-light); padding: 2rem; }
    .ppt-note mat-icon { font-size: 48px; width: 48px; height: 48px; }
    mat-dialog-actions { flex: 0 0 auto; padding: 0.5rem 1.25rem; }
    @media (max-width: 600px) {
      h2[mat-dialog-title] { gap: 0.5rem; padding: 0.5rem 0.75rem; }
      .dialog-title-text { font-size: 1rem; }
      .zoom-controls { gap: 0; }
      .zoom-controls button[mat-button] { display: none; }
      .preview-content { padding: 0 0.5rem; }
      mat-dialog-actions { padding: 0.375rem 0.75rem; }
    }
  `]
})
export class FilePreviewDialogComponent implements OnInit {
  @ViewChild('wordContainer', { static: false }) wordContainer!: ElementRef;
  @ViewChild('excelContainer', { static: false }) excelContainer!: ElementRef;

  blobUrl: string | null = null;
  trustedUrl: SafeResourceUrl | null = null;
  kind: 'pdf' | 'image' | 'video' | 'text' | 'word' | 'excel' | 'ppt' = 'pdf';
  textContent = '';
  zoom = 1;

  constructor(
    public fileService: FileService,
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data: FilePreviewData,
  ) {}

  zoomIn() { this.zoom = Math.min(2.5, +(this.zoom + 0.25).toFixed(2)); }
  zoomOut() { this.zoom = Math.max(0.5, +(this.zoom - 0.25).toFixed(2)); }

  ngOnInit() {
    this.fileService.getBlob(this.data.fileId).subscribe({
      next: (blob) => {
        this.detectKind(blob);
        if (this.kind === 'text') {
          blob.text().then(t => { this.textContent = t; });
          return;
        }
        if (this.kind === 'word') {
          blob.arrayBuffer().then(buf => this.renderWord(buf));
          return;
        }
        if (this.kind === 'excel') {
          blob.arrayBuffer().then(buf => this.renderExcel(buf));
          return;
        }
        this.blobUrl = URL.createObjectURL(blob);
        this.trustedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl);
      },
      error: (err) => console.error('Error previewing file:', err),
    });
  }

  private detectKind(blob: Blob) {
    const type = blob.type || '';
    if (type.includes('pdf')) this.kind = 'pdf';
    else if (type.includes('image')) this.kind = 'image';
    else if (type.includes('video')) this.kind = 'video';
    else if (type.includes('wordprocessingml') || type.includes('msword')) this.kind = 'word';
    else if (type.includes('spreadsheetml') || type.includes('excel')) this.kind = 'excel';
    else if (type.includes('presentationml')) this.kind = 'ppt';
    else if (type.includes('text') || type.includes('json') || type.includes('csv')) this.kind = 'text';
    else this.kind = 'ppt';
  }

  private renderWord(buffer: ArrayBuffer) {
    setTimeout(() => {
      if (this.wordContainer) {
        renderAsync(buffer, this.wordContainer.nativeElement as any, null, {
          inWrapper: true,
          ignoreWidth: true,
        }).catch(err => console.error('Error rendering docx:', err));
      }
    });
  }

  private renderExcel(buffer: ArrayBuffer) {
    try {
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      const firstSheet = wb.SheetNames[0];
      const ws = wb.Sheets[firstSheet];
      const html = XLSX.utils.sheet_to_html(ws);
      setTimeout(() => {
        if (this.excelContainer) {
          this.excelContainer.nativeElement.innerHTML = html;
        }
      });
    } catch (err) {
      console.error('Error rendering xlsx:', err);
    }
  }

  download() {
    this.fileService.download(this.data.fileId, this.data.title);
  }
}
