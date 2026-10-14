import { Injectable, signal, computed } from '@angular/core';
import { TrashEntry } from '../models/trash.model';

/**
 * Estado de la papelera basado en Signals (Spec: Signals para features nuevos).
 *
 * `providedIn: 'root'` permite que el listado persista entre navegaciones.
 */
@Injectable({ providedIn: 'root' })
export class TrashStore {
  readonly entries = signal<TrashEntry[]>([]);
  readonly loading = signal<boolean>(false);
  /** Acción en curso (restaurar/eliminar) por id de entrada. */
  readonly busyEntryId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly confirmation = signal<string | null>(null);

  /** Entradas NO restauradas (el backend ya las filtra, refuerzo local). */
  readonly nonRestored = computed(() =>
    this.entries().filter((e) => !e.isRestored),
  );

  /** Entradas que fallaron al restaurar (original hard-deleted) — visibles para retry/borrado. */
  readonly failedEntries = computed(() =>
    this.entries().filter((e) => !!e.restoreError),
  );

  setEntries(entries: TrashEntry[]): void {
    this.entries.set(entries);
  }

  removeEntry(id: string): void {
    this.entries.update((current) => current.filter((e) => e._id !== id));
  }

  upsertEntry(entry: TrashEntry): void {
    this.entries.update((current) => {
      const idx = current.findIndex((e) => e._id === entry._id);
      if (idx === -1) return [entry, ...current];
      const copy = [...current];
      copy[idx] = entry;
      return copy;
    });
  }

  setLoading(loading: boolean): void {
    this.loading.set(loading);
  }

  setBusyEntryId(id: string | null): void {
    this.busyEntryId.set(id);
  }

  setError(error: string | null): void {
    this.error.set(error);
  }

  setConfirmation(message: string | null): void {
    this.confirmation.set(message);
  }

  reset(): void {
    this.entries.set([]);
    this.loading.set(false);
    this.busyEntryId.set(null);
    this.error.set(null);
    this.confirmation.set(null);
  }
}