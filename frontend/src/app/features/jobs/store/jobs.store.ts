import { Injectable, signal, computed } from '@angular/core';
import { Job, JobStatus } from '../models/job.model';

/**
 * Estado del feature de ofertas laborales basado en Signals
 * (Spec: Signals para los features nuevos).
 *
 * `providedIn: 'root'` permite compartir la lista entre job-list,
 * job-detail y job-admin sin recargar en cada navegación.
 */
@Injectable({ providedIn: 'root' })
export class JobsStore {
  readonly jobs = signal<Job[]>([]);
  readonly selectedJob = signal<Job | null>(null);
  readonly loading = signal<boolean>(false);
  /** Envío en curso (postular, guardar oferta, cambiar estado). */
  readonly submitting = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  /** Mensaje de confirmación (p. ej. "Postulación enviada"). */
  readonly confirmation = signal<string | null>(null);

  /** Ofertas vigentes (status ACTIVA) — vista de estudiante. */
  readonly activeJobs = computed(() =>
    this.jobs().filter((job) => job.status === JobStatus.ACTIVA),
  );

  /** Conteo para el badge del navbar (Spec O6b): activas y con plazo vigente. */
  readonly activeOfferCount = computed(
    () => this.jobs().filter((job) => job.status === JobStatus.ACTIVA && !this.isPastDeadline(job)).length,
  );

  /** Oferta vigente y con plazo abierto (para decidir si se puede postular). */
  readonly canApplyToSelected = computed(() => {
    const job = this.selectedJob();
    if (!job || job.status !== JobStatus.ACTIVA) return false;
    return !this.isPastDeadline(job);
  });

  private isPastDeadline(job: Job): boolean {
    if (!job.deadline) return false;
    return new Date(job.deadline).getTime() < Date.now();
  }

  setJobs(jobs: Job[]): void {
    this.jobs.set(jobs);
  }

  upsertJob(job: Job): void {
    this.jobs.update((current) => {
      const idx = current.findIndex((j) => j._id === job._id);
      if (idx === -1) return [job, ...current];
      const copy = [...current];
      copy[idx] = job;
      return copy;
    });
  }

  removeJob(id: string): void {
    this.jobs.update((current) => current.filter((j) => j._id !== id));
  }

  setSelectedJob(job: Job | null): void {
    this.selectedJob.set(job);
    this.confirmation.set(null);
    this.error.set(null);
  }

  setLoading(loading: boolean): void {
    this.loading.set(loading);
  }

  setSubmitting(submitting: boolean): void {
    this.submitting.set(submitting);
  }

  setError(error: string | null): void {
    this.error.set(error);
  }

  setConfirmation(message: string | null): void {
    this.confirmation.set(message);
  }

  reset(): void {
    this.jobs.set([]);
    this.selectedJob.set(null);
    this.loading.set(false);
    this.submitting.set(false);
    this.error.set(null);
    this.confirmation.set(null);
  }
}
