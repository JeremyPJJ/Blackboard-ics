import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="empty-state" role="status">
      <p class="empty-text">{{ message }}</p>
      <ng-content></ng-content>
    </section>
  `,
  styles: [`
    .empty-state {
      text-align: center;
      padding: 2rem;
      background: var(--color-white);
      border-radius: 8px;
      color: var(--color-text-light);
    }

    .empty-text {
      margin: 0 0 1rem 0;
    }
  `]
})
export class EmptyStateComponent {
  @Input() message = 'No hay elementos disponibles';
}