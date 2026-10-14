import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-back-button',
  standalone: false,
  template: `
    <button mat-icon-button class="back-button" (click)="goBack()" aria-label="Volver atrás">
      <mat-icon>arrow_back</mat-icon>
    </button>
  `,
  styles: [`
    .back-button {
      color: var(--color-primary);
      margin-right: 0.5rem;
    }
  `]
})
export class BackButtonComponent {
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}