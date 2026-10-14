import { Injectable, signal, computed } from '@angular/core';
import {
  ImportConfirmResponse,
  ImportPreviewRow,
  ImportSummary,
  LocalPreviewRow,
} from '../models/import.model';

/**
 * Estado del feature de importación masiva basado en Signals (Spec: Signals
 * para los features nuevos). `providedIn: 'root'` conserva el archivo y los
 * resultados entre la vista de preview y la de confirmación.
 */
@Injectable({ providedIn: 'root' })
export class ImportsStore {
  readonly file = signal<File | null>(null);
  readonly fileName = signal<string>('');
  /** Filas parseadas LOCALMENTE con `xlsx` (feedback inmediato al elegir archivo). */
  readonly localRows = signal<LocalPreviewRow[]>([]);
  /** Resumen autoritativo del endpoint de preview del backend. */
  readonly summary = signal<ImportSummary | null>(null);
  /** Respuesta del endpoint de confirm. */
  readonly confirmResult = signal<ImportConfirmResponse | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly courseId = signal<string>('');
  readonly courseName = signal<string>('');

  readonly total = computed(() => this.summary()?.total ?? this.localRows().length);
  readonly validCount = computed(() => this.summary()?.valid ?? 0);
  readonly duplicateCount = computed(() => this.summary()?.duplicate ?? 0);
  readonly errorCount = computed(() => this.summary()?.error ?? 0);
  readonly hasServerSummary = computed(() => this.summary() !== null);

  setFile(file: File): void {
    this.file.set(file);
    this.fileName.set(file.name);
  }

  setLocalRows(rows: LocalPreviewRow[]): void {
    this.localRows.set(rows);
  }

  setSummary(summary: ImportSummary): void {
    this.summary.set(summary);
  }

  setConfirmResult(result: ImportConfirmResponse): void {
    this.confirmResult.set(result);
  }

  setLoading(loading: boolean): void {
    this.loading.set(loading);
  }

  setError(error: string | null): void {
    this.error.set(error);
  }

  setCourse(courseId: string, courseName: string): void {
    this.courseId.set(courseId);
    this.courseName.set(courseName);
  }

  reset(): void {
    this.file.set(null);
    this.fileName.set('');
    this.localRows.set([]);
    this.summary.set(null);
    this.confirmResult.set(null);
    this.loading.set(false);
    this.error.set(null);
  }
}