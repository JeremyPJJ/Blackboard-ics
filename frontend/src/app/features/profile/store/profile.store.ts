import { Injectable, signal } from '@angular/core';
import { User } from '@core/models/user.model';

/**
 * Estado del diálogo de perfil basado en Signals (Spec: Signals para features nuevos).
 *
 * `providedIn: 'root'` mantiene el estado simple del formulario entre aperturas.
 */
@Injectable({ providedIn: 'root' })
export class ProfileStore {
  /** Usuario actual mostrado en el perfil. */
  readonly user = signal<User | null>(null);

  /** Enviando formulario de cambio de contraseña. */
  readonly submitting = signal<boolean>(false);

  /** Mensaje de éxito tras cambiar la contraseña. */
  readonly success = signal<string | null>(null);

  /** Error de formulario (401 contraseña actual incorrecta / 400 validación / 429 rate-limit). */
  readonly error = signal<string | null>(null);

  setUser(user: User | null): void {
    this.user.set(user);
  }

  setSubmitting(submitting: boolean): void {
    this.submitting.set(submitting);
  }

  setSuccess(message: string | null): void {
    this.success.set(message);
  }

  setError(error: string | null): void {
    this.error.set(error);
  }

  reset(): void {
    this.submitting.set(false);
    this.success.set(null);
    this.error.set(null);
  }
}
