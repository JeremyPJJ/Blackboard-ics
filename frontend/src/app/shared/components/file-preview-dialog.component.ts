import { Component, Inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';
import { FileService } from '@core/services/file.service';
import { NotificationService } from '@core/services/notification.service';

export interface FilePreviewData {
  fileId: string;
  title: string;
  /** Tipo lógico del material (pdf, doc, foto, ...) para inferir cuando el MIME viene genérico. */
  fileType?: string;
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
      <button mat-icon-button class="dialog-close" mat-dialog-close aria-label="Cerrar" title="Cerrar">
        <mat-icon>close</mat-icon>
      </button>
    </h2>
    <mat-dialog-content class="preview-content">
      <div class="preview-box" [class.zoomable]="kind === 'pdf' || kind === 'image' || kind === 'video'">
        <div class="zoom-stage" [style.transform]="kind === 'pdf' || kind === 'image' || kind === 'video' ? 'scale(' + zoom + ')' : null">
          <iframe *ngIf="kind === 'pdf'" #pdfFrame class="preview-frame"></iframe>
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
        <div *ngIf="error" class="preview-error">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error }}</p>
          <button mat-stroked-button color="primary" type="button" (click)="retry()">
            <mat-icon>refresh</mat-icon> Reintentar
          </button>
          <p class="preview-error-hint">
            Si el problema continúa, el archivo puede haber sido eliminado del servidor.
            Vuelve a adjuntarlo editando el material.
          </p>
        </div>
        <div *ngIf="loading && !error" class="preview-loading">Cargando archivo...</div>
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
    .dialog-close { flex: 0 0 auto; margin-left: 0.25rem; }
    .preview-content { flex: 1 1 auto; width: 100%; min-width: 0; min-height: 0; max-width: none; max-height: none; padding: 0 1rem; }
    .preview-box { display: grid; place-items: center; width: 100%; height: 100%; min-height: 0; background: #f8fafc; border: 1px solid #e3e8ef; border-radius: 8px; overflow: auto; }
    .preview-box.zoomable { overflow: auto; }
    .zoom-stage { display: flex; justify-content: center; width: 100%; height: 100%; min-height: 0; transform-origin: top center; }
    .preview-frame { width: 100%; height: 100%; min-height: 0; border: none; }
    .preview-img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .preview-video { width: 100%; height: 100%; object-fit: contain; }
    .preview-text { width: 100%; height: 100%; overflow: auto; padding: 1rem; font-size: 0.875rem; white-space: pre-wrap; }
    .preview-loading { color: var(--color-text-light); }
    .preview-error { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 2rem 1.5rem; text-align: center; }
    .preview-error mat-icon { font-size: 44px; width: 44px; height: 44px; color: var(--color-danger); }
    .preview-error p { margin: 0; color: var(--color-gray-dark); }
    .preview-error .preview-error-hint { max-width: 460px; color: var(--color-text-light); font-size: 0.8125rem; }
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
export class FilePreviewDialogComponent implements OnInit, OnDestroy {
  @ViewChild('wordContainer', { static: false }) wordContainer!: ElementRef;
  @ViewChild('excelContainer', { static: false }) excelContainer!: ElementRef;
  @ViewChild('pdfFrame', { static: false }) pdfFrame?: ElementRef<HTMLIFrameElement>;

  blobUrl: string | null = null;
  kind: 'pdf' | 'image' | 'video' | 'text' | 'word' | 'excel' | 'ppt' = 'pdf';
  textContent = '';
  zoom = 1;
  loading = true;
  error: string | null = null;

  constructor(
    public fileService: FileService,
    private notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: FilePreviewData,
  ) {}

  zoomIn() { this.zoom = Math.min(2.5, +(this.zoom + 0.25).toFixed(2)); }
  zoomOut() { this.zoom = Math.max(0.5, +(this.zoom - 0.25).toFixed(2)); }

  ngOnInit() {
    this.loadFile();
  }

  ngOnDestroy() {
    this.revokeBlobUrl();
  }

  retry(): void {
    this.revokeBlobUrl();
    this.error = null;
    this.kind = 'pdf';
    this.textContent = '';
    this.loadFile();
  }

  private loadFile(): void {
    this.loading = true;
    this.fileService.getBlob(this.data.fileId).subscribe({
      next: (blob) => {
        this.loading = false;
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
        if (this.kind === 'pdf') {
          this.attachPdf();
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'No se pudo cargar el archivo. Puede que ya no esté disponible en el servidor.';
        console.error('Error previewing file:', err);
      },
    });
  }

  /** Asigna el blob URL directamente al iframe (evita el contexto RESOURCE_URL del template). */
  private attachPdf(): void {
    setTimeout(() => {
      if (this.pdfFrame && this.blobUrl) {
        this.pdfFrame.nativeElement.src = this.blobUrl;
      }
    });
  }

  private revokeBlobUrl(): void {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
  }

  private detectKind(blob: Blob) {
    const type = (blob.type || '').toLowerCase();
    if (type.includes('pdf')) this.kind = 'pdf';
    else if (type.includes('image')) this.kind = 'image';
    else if (type.includes('video')) this.kind = 'video';
    else if (type.includes('wordprocessingml') || type.includes('msword')) this.kind = 'word';
    else if (type.includes('spreadsheetml') || type.includes('excel')) this.kind = 'excel';
    else if (type.includes('presentationml') || type.includes('powerpoint')) this.kind = 'ppt';
    else if (type.includes('text') || type.includes('json') || type.includes('csv')) this.kind = 'text';
    else this.kind = this.kindFromFileType();
  }

  /** Fallback cuando el servidor devuelve un MIME genérico (application/octet-stream). */
  private kindFromFileType(): 'pdf' | 'image' | 'video' | 'text' | 'word' | 'excel' | 'ppt' {
    switch (this.data.fileType) {
      case 'pdf': return 'pdf';
      case 'foto': return 'image';
      case 'video': return 'video';
      case 'texto': return 'text';
      case 'doc': return 'word';
      default: return 'ppt';
    }
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
    this.fileService.download(this.data.fileId, this.data.title, () => {
      this.notificationService.error('No se pudo descargar el archivo. Puede que ya no esté disponible.');
    });
  }
}
