import { Component, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { JobsStore } from '../store/jobs.store';
import { JobsService } from '../services/jobs.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import {
  JobApplication,
  APPLICATION_STATUS_LABELS,
  JOB_STATUS_LABELS,
} from '../models/job.model';

/**
 * Detalle de una oferta laboral (Spec: Job Offers).
 *
 * Vista orientada al estudiante: información completa de la oferta, botón
 * para postular (si la oferta está activa y aún no postuló) y el estado
 * actual de su postulación (p. ej. POSTULADO → FINALISTA cuando el admin la
 * revisa).
 */
@Component({
  selector: 'app-job-detail',
  standalone: false,
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.scss'],
})
export class JobDetailComponent implements OnInit {
  readonly job = this.store.selectedJob;
  readonly statusLabels = JOB_STATUS_LABELS;
  readonly applicationLabels = APPLICATION_STATUS_LABELS;

  readonly canApply = this.authService.hasPermission('ofertas.postular');

  /** Postulación del usuario actual dentro de la oferta seleccionada. */
  readonly myApplication = computed<JobApplication | null>(() => {
    const current = this.job();
    if (!current || !current.applications) return null;
    const userId = this.authService.getCurrentUser()?._id;
    if (!userId) return null;
    return (
      current.applications.find(
        (app) => app.studentId?.toString() === userId.toString(),
      ) ?? null
    );
  });

  readonly canSubmitApplication = computed(
    () =>
      this.canApply &&
      !!this.job() &&
      this.job()!.status === 'activa' &&
      this.isDeadlineOpen(this.job()!) &&
      !this.myApplication(),
  );

  constructor(
    readonly store: JobsStore,
    private route: ActivatedRoute,
    private router: Router,
    private jobsService: JobsService,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    await this.loadJob(id);
  }

  async loadJob(id: string): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);
    try {
      const job = await lastValueFrom(this.jobsService.getJobById(id));
      this.store.setSelectedJob(job);
    } catch (error: any) {
      this.store.setSelectedJob(null);
      this.store.setError(error?.error?.message ?? 'Oferta laboral no encontrada');
    } finally {
      this.store.setLoading(false);
    }
  }

  isDeadlineOpen(job: any): boolean {
    if (!job.deadline) return true;
    return new Date(job.deadline).getTime() >= Date.now();
  }

  goToApply(): void {
    const id = this.job()?._id;
    if (!id) return;
    void this.router.navigate(['/jobs', id, 'apply']);
  }

  goBackToList(): void {
    void this.router.navigate(['/jobs']);
  }

  getRequirements(job: any): string[] {
    return Array.isArray(job?.requirements) ? job.requirements : [];
  }
}