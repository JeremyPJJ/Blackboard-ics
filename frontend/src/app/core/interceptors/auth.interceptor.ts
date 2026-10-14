import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing$ = new BehaviorSubject<boolean>(false);

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Endpoints de auth (login/refresh) no llevan token ni disparan refresh
    const isAuthRequest = req.url.includes('/api/auth/login') || req.url.includes('/api/auth/refresh');

    // change-password SÍ lleva token (AuthGuard jwt) pero su 401 significa
    // "contraseña actual incorrecta", NO token expirado: no debe intentar refresh
    // ni forzar logout (el diálogo de perfil muestra el error).
    const isChangePassword = req.url.includes('/api/auth/change-password');

    const token = localStorage.getItem('accessToken');

    // Clonar la request y agregar el token si existe
    let authReq = req;
    if (token && !isAuthRequest) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !isAuthRequest && !isChangePassword) {
          // Excluir la URL de refresh para evitar loop infinito
          if (req.url.includes('/api/auth/refresh')) {
            // Refresh falló, limpiar sesión y avisar al usuario
            this.authService.clearSession();
            this.notificationService.warning('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
            this.router.navigate(['/login']);
            return throwError(() => error);
          }
          // Token expirado, intentar refresh
          return this.handle401Error(authReq, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing$.value) {
      this.isRefreshing$.next(true);

      return this.authService.refreshToken().pipe(
        switchMap((response) => {
          this.isRefreshing$.next(false);
          // Retry la request original con el nuevo token
          const newToken = response.accessToken;
          const retryRequest = request.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
            },
          });
          return next.handle(retryRequest);
        }),
        catchError((error) => {
          this.isRefreshing$.next(false);
          // Refresh falló, limpiar sesión y avisar al usuario
          this.authService.clearSession();
          this.notificationService.warning('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
          this.router.navigate(['/login']);
          return throwError(() => error);
        })
      );
    } else {
      // Ya hay un refresh en curso, esperar a que termine
      return this.isRefreshing$.pipe(
        filter(refreshing => !refreshing),
        take(1),
        switchMap(() => {
          const token = localStorage.getItem('accessToken');
          const retryRequest = request.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          });
          return next.handle(retryRequest);
        })
      );
    }
  }
}
