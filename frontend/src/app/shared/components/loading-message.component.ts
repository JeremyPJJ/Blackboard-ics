import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="loading-state" role="status" aria-live="polite">
      <div class="loading-spinner" aria-hidden="true"></div>
      <p class="loading-text">{{ message }}</p>
    </section>
  `,
  styles: [`
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: var(--color-white);
      border-radius: 8px;
      gap: 1rem;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .loading-text {
      color: var(--color-text-light);
      font-size: 0.875rem;
      margin: 0;
    }
  `]
})
export class LoadingMessageComponent {
  @Input() message = 'Cargando...';
}