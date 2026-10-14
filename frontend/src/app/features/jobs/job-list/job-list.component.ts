import { Component, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { JobsStore } from '../store/jobs.store';
import { JobsService } from '../services/jobs.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { Job, JOB_STATUS_LABELS } from '../models/job.model';

/**
 * Listado de ofertas laborales (Spec: Job Offers).
 *
 * - Estudiantes (ofertas.ver): ven las ofertas ACTIVAS y pueden entrar al detalle para postular.
 * - Usuarios autorizados (ofertas.ver + ofertas.crear): ven todas las ofertas y acceden a
 *   la gestión (crear/editar/cerrar + revisar postulaciones).
 * - Docente (ofertas.crear SIN ofertas.ver, R7): deep-link /jobs → redirect a /jobs/admin
 *   sin llamar a loadJobs() (el GET /jobs devolvería 403).
 * - Rol sin claves de ofertas: empty state, sin llamadas.
 */
@Component({
  selector: 'app-job-list',
  standalone: false,
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.scss'],
})
export class JobListComponent implements OnInit {
  readonly canView = this.authService.hasPermission('ofertas.ver');
  readonly canManage = this.authService.hasPermission('ofertas.crear');
  readonly canApply = this.authService.hasPermission('ofertas.postular');

  /** La lista SOLO se renderiza con ofertas.ver; si solo puede crear (docente) se redirige. */
  readonly visibleJobs = computed(() => {
    if (!this.canView) return [];
    return this.canManage ? this.store.jobs() : this.store.activeJobs();
  });

  readonly statusLabels = JOB_STATUS_LABELS;

  constructor(
    readonly store: JobsStore,
    private jobsService: JobsService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    // Docente (ofertas.crear sin ofertas.ver): /jobs → /jobs/admin, sin GET /jobs.
    if (!this.canView && this.canManage) {
      void this.router.navigate(['/jobs/admin'], { replaceUrl: true });
      return;
    }
    // Rol sin permisos de ofertas: empty state, sin llamadas.
    if (!this.canView) {
      return;
    }
    if (this.store.jobs().length > 0) {
      return;
    }
    await this.loadJobs();
  }

  async loadJobs(): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);
    try {
      const jobs = await lastValueFrom(this.jobsService.getJobs());
      this.store.setJobs(jobs);
    } catch (error: any) {
      this.store.setError(error?.error?.message ?? 'Error al cargar las ofertas laborales');
      this.notificationService.error('No se pudieron cargar las ofertas laborales');
    } finally {
      this.store.setLoading(false);
    }
  }

  isActive(job: Job): boolean {
    return job.status === 'activa';
  }

  isDeadlineOpen(job: Job): boolean {
    if (!job.deadline) return true;
    return new Date(job.deadline).getTime() >= Date.now();
  }

  goToDetail(job: Job): void {
    void this.router.navigate(['/jobs', job._id]);
  }

  goToApply(job: Job): void {
    void this.router.navigate(['/jobs', job._id, 'apply']);
  }

  goToAdmin(): void {
    void this.router.navigate(['/jobs/admin']);
  }
}