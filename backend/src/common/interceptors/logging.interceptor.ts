import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LogsService } from '../../modules/logs/logs.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logsService: LogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const { method, url } = request;
    const userId = request.user?._id?.toString();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const status = http.getResponse().statusCode;
          // No loguear endpoints de logs para evitar ruido
          if (url.includes('/api/logs')) return;
          this.logsService.create({
            level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
            source: 'backend',
            message: `${method} ${url} -> ${status}`,
            method,
            url,
            statusCode: status,
            userId,
            duration: Date.now() - start,
          });
        },
        error: (err) => {
          if (url.includes('/api/logs')) return;
          this.logsService.create({
            level: 'error',
            source: 'backend',
            message: `${method} ${url} -> ${err?.status || 500} ${err?.message || ''}`,
            method,
            url,
            statusCode: err?.status || 500,
            userId,
            duration: Date.now() - start,
            meta: { message: err?.message, stack: err?.stack?.split('\n').slice(0, 5) },
          });
        },
      }),
    );
  }
}