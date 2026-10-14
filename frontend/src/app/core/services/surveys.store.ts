import { Injectable, signal } from '@angular/core';

/**
 * Estado del badge de encuestas pendientes del navbar (Spec O6b / N7).
 *
 * - `refreshBadges` del AppComponent recalcula el conteo desde REST al navegar
 *   (autoritativo; reconcilia el decremento local en caso de desvío).
 * - Al responder una encuesta se decrementa localmente (sin esperar
 *   navegación); el piso es 0: submits repetidos nunca bajan de cero.
 */
@Injectable({ providedIn: 'root' })
export class SurveysStore {
  readonly pendingSurveys = signal(0);

  setPending(count: number): void {
    this.pendingSurveys.set(count);
  }

  decrementPending(): void {
    this.pendingSurveys.update((v) => Math.max(0, v - 1));
  }
}