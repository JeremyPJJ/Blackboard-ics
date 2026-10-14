import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

@Injectable({
  providedIn: 'root',
})
export class LogService {
  private apiUrl = '/api/logs';

  constructor(private http: HttpClient) {}

  log(level: LogLevel, message: string, meta?: any): void {
    this.http.post(this.apiUrl, { level, source: 'frontend', message, meta }).subscribe({
      error: () => {}, // silencioso: no debe romper la app
    });
  }

  info(message: string, meta?: any): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: any): void {
    this.log('error', message, meta);
  }

  debug(message: string, meta?: any): void {
    this.log('debug', message, meta);
  }
}