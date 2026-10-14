import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private defaultConfig: MatSnackBarConfig = {
    duration: 3000,
    horizontalPosition: 'end',
    verticalPosition: 'bottom',
    panelClass: 'notification-snackbar'
  };

  constructor(private snackBar: MatSnackBar) {}

  success(message: string, duration?: number): void {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      duration: duration || 3000,
      panelClass: ['notification-snackbar', 'notification-success']
    });
  }

  error(message: string, action?: string, onAction?: () => void): void {
    const config: MatSnackBarConfig = {
      ...this.defaultConfig,
      duration: 5000,
      panelClass: ['notification-snackbar', 'notification-error']
    };

    const snackBarRef = this.snackBar.open(message, action || 'Cerrar', config);

    if (action && onAction) {
      snackBarRef.onAction().subscribe(() => {
        onAction();
      });
    }
  }

  warning(message: string, duration?: number): void {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      duration: duration || 4000,
      panelClass: ['notification-snackbar', 'notification-warning']
    });
  }

  info(message: string, duration?: number, extraClass?: string): void {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      duration: duration || 3000,
      panelClass: extraClass
        ? ['notification-snackbar', 'notification-info', extraClass]
        : ['notification-snackbar', 'notification-info']
    });
  }
}
