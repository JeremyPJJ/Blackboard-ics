import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  constructor(private readonly titleService: Title) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    this.titleService.setTitle(
      pageTitle ? `${pageTitle} | SIGA-ICS` : 'SIGA-ICS | IESTP Ciencias de la Salud'
    );
  }
}
