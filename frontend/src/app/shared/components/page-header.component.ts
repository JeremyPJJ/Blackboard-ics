import { Component, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule],
  template: `
    <div class="page-header-container">
      <div class="breadcrumb-nav">
        <button mat-icon-button (click)="goBack()" aria-label="Volver atrás" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <nav class="breadcrumb" *ngIf="breadcrumbs.length > 0">
          <a *ngFor="let crumb of breadcrumbs; let last = last" 
             [routerLink]="crumb.url" 
             [class.active]="last">
            {{ crumb.label }}
          </a>
        </nav>
      </div>
      
      <div class="header-actions">
        <h1>{{ title }}</h1>
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-header-container {
      margin-bottom: 2rem;
    }

    .breadcrumb-nav {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .back-button {
      color: var(--color-primary);
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;

      a {
        color: var(--color-accent);
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }

        &.active {
          color: var(--color-gray-dark);
          font-weight: 500;
        }
      }

      .separator {
        color: var(--color-gray-dark);
      }
    }

    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h1 {
        color: var(--color-primary);
        margin: 0;
        font-size: 1.75rem;
      }
    }
  `]
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() breadcrumbs: { label: string; url: string }[] = [];

  constructor(
    private location: Location,
    private router: Router
  ) {}

  goBack(): void {
    this.location.back();
  }
}
