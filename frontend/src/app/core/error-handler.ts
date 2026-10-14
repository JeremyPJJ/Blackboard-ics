import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { NotificationService } from './services/notification.service';
import { LogService } from './services/log.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private notificationService: NotificationService;
  private logService: LogService;

  constructor(private injector: Injector) {
    // Usar setTimeout para evitar dependencias circulares
    setTimeout(() => {
      this.notificationService = this.injector.get(NotificationService);
      this.logService = this.injector.get(LogService);
    });
  }

  handleError(error: any): void {
    console.error('Global error handler:', error);

    const message = error?.message || error?.rejection?.message || 'Error inesperado en la aplicación';

    // Registrar en el backend (logs de eventos)
    if (this.logService) {
      this.logService.error(message, {
        stack: error?.stack?.split('\n').slice(0, 8),
        rejection: error?.rejection ? String(error?.rejection) : undefined,
      });
    }

    // Notificar al usuario
    if (this.notificationService) {
      this.notificationService.error(message, 'Reportar', () => {
        if (this.logService) {
          this.logService.error('Error reportado por el usuario: ' + message);
        }
      });
    }
  }
}