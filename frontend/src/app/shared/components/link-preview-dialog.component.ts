import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface LinkPreviewData {
  url: string;
  title: string;
}

@Component({
  selector: 'app-link-preview-dialog',
  standalone: false,
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content class="link-content">
      <div class="link-box">
        <iframe [src]="trustedUrl" class="link-frame" (load)="loaded = true"></iframe>
        <div *ngIf="!loaded" class="link-loading">
          <mat-spinner diameter="32"></mat-spinner>
          <p>Cargando enlace...</p>
        </div>
      </div>
      <p class="link-note">
        Si el sitio no se muestra aquí, es porque el sitio bloquea la vista embebida (X-Frame-Options).
        Usá "Abrir en pestaña" para verlo.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button color="primary" (click)="openInTab()">
        <mat-icon>open_in_new</mat-icon> Abrir en pestaña
      </button>
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .link-content { min-width: 560px; max-width: 94vw; min-height: 380px; }
    .link-box { position: relative; min-height: 380px; background: #f8fafc; border: 1px solid #e3e8ef; border-radius: 8px; overflow: hidden; }
    .link-frame { width: 100%; height: 420px; border: none; }
    .link-loading { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; color: var(--color-text-light); }
    .link-note { color: var(--color-text-light); font-size: 0.8125rem; margin-top: 0.75rem; }
    @media (max-width: 600px) { .link-content { min-width: 88vw; } }
  `]
})
export class LinkPreviewDialogComponent {
  trustedUrl: SafeResourceUrl;
  loaded = false;

  constructor(
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data: LinkPreviewData,
  ) {
    this.trustedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.url);
  }

  openInTab() {
    window.open(this.data.url, '_blank');
  }
}