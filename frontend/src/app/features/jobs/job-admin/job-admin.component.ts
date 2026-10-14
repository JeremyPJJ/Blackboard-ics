import { Component, OnInit, signal, computed } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { JobsStore } from '../store/jobs.store';
import { JobsService } from '../services/jobs.service';
import { UserService } from '@core/services/user.service';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import {
  ApplicationStatus,
  APPLICATION_STATUS_LABELS,
  Job,
  JobModality,
  JobPayload,
  JOB_STATUS_LABELS,
} from '../models/job.model';

/**
 * Gestión de ofertas laborales (Spec: Job Offers — "3 secciones").
 * Accesible solo para usuarios autorizados (ruta con RoleGuard; cada acción
 * exige `ofertas.crear|editar|eliminar|revisar` en el backend).
 *
 * Tres pestañas gateadas por permiso (Spec jobs R3+R7):
 * - "Registrar": formulario de crear/editar (ofertas.crear).
 * - "Ver postulaciones": revisar postulaciones y cambiar su estado
 *   (POSTULADO → EN_ANALISIS → FINALISTA / NO_SELECCIONADO) — ofertas.ver|revisar.
 * - "Ver ofertas": tabla con editar/cerrar/eliminar (ofertas.ver).
 *
 * Si el usuario no tiene `ofertas.ver` (docente tras R7), se omite loadJobs()
 * para evitar el 403 del GET /jobs que rompería la página.
 */
@Component({
  selector: 'app-job-admin',
  standalone: false,
  templateUrl: './job-admin.component.html',
  styleUrls: ['./job-admin.component.scss'],
})
export class JobAdminComponent implements OnInit {
  readonly jobs = this.store.jobs;
  readonly loading = this.store.loading;
  readonly statusLabels = JOB_STATUS_LABELS;
  readonly applicationLabels = APPLICATION_STATUS_LABELS;
  readonly modalities = Object.values(JobModality);
  readonly statusOptions = Object.values(ApplicationStatus);

  // --- Tab de postulaciones ---
  readonly selectedOfferId = signal<string>('');
  readonly changingStatus = signal<number | null>(null);
  /** Filtro opcional de postulaciones por estado (Spec: "filtro estado opcional"). */
  readonly statusFilter = signal<ApplicationStatus | ''>('');
  /** Aplicaciones filtradas preservando el índice real en offer.applications. */
  readonly filteredApplications = computed(() => {
    const apps = this.selectedOffer()?.applications ?? [];
    const filter = this.statusFilter();
    return apps
      .map((app, index) => ({ app, index }))
      .filter(({ app }) => !filter || app.status === filter);
  });

  // --- Formulario de oferta (crear / editar) ---
  readonly editingId = signal<string | null>(null);
  readonly formSubmitting = signal<boolean>(false);
  company = '';
  position = '';
  description = '';
  requirementsText = '';
  career = '';
  modality: JobModality | '' = '';
  salary = '';
  deadline = '';
  contactEmail = '';
  contactPhone = '';
  location = '';
  formTouched = false;

  /** Map studentId → "lastNames, names" para mostrar quién postuló. */
  private usersMap = new Map<string, string>();

  constructor(
    readonly store: JobsStore,
    private jobsService: JobsService,
    private userService: UserService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private authService: AuthService,
    public fileService: FileService,
  ) {}

  /** ¿Puede ver la lista de ofertas? Gate del tab "Ver ofertas" y de loadJobs(). */
  get canSeeJobs(): boolean {
    return this.authService.hasPermission('ofertas.ver');
  }

  /** ¿Puede revisar postulaciones? Gate del tab "Ver postulaciones". */
  get canReview(): boolean {
    return this.authService.hasPermission('ofertas.revisar');
  }

  /** ¿Puede registrar ofertas? Gate del tab "Registrar". */
  get canManage(): boolean {
    return this.authService.hasPermission('ofertas.crear');
  }

  async ngOnInit(): Promise<void> {
    // Sin ofertas.ver se OMITE loadJobs() (el GET /jobs devolvería 403).
    if (this.canSeeJobs && this.store.jobs().length === 0) {
      await this.loadJobs();
    }
    await this.loadUsersMap();
    if (this.canSeeJobs && this.store.jobs().length > 0 && !this.selectedOfferId()) {
      this.selectedOfferId.set(this.store.jobs()[0]._id);
    }
  }

  async loadJobs(): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);
    try {
      const jobs = await lastValueFrom(this.jobsService.getJobs());
      this.store.setJobs(jobs);
    } catch (error: any) {
      this.store.setError(error?.error?.message ?? 'Error al cargar las ofertas');
      this.notificationService.error('No se pudieron cargar las ofertas laborales');
    } finally {
      this.store.setLoading(false);
    }
  }

  private async loadUsersMap(): Promise<void> {
    try {
      const users = await lastValueFrom(this.userService.getUsers());
      this.usersMap = new Map(
        users.map((u) => [u._id, `${u.lastNames}, ${u.names}`]),
      );
    } catch {
      // Si no se pueden cargar los nombres, se muestra el studentId.
      this.usersMap = new Map();
    }
  }

  studentName(studentId: string): string {
    return this.usersMap.get(studentId?.toString()) ?? studentId?.toString() ?? '—';
  }

  /** Descarga el CV adjunto de una postulación (R6-5). */
  downloadAttachment(fileId: string, index: number): void {
    this.fileService.download(fileId, `cv_${index + 1}`);
  }

  // ------------------------------------------------------------------
  // Formulario: crear / editar
  // ------------------------------------------------------------------

  startCreate(): void {
    this.editingId.set(null);
    this.formTouched = false;
    this.company = '';
    this.position = '';
    this.description = '';
    this.requirementsText = '';
    this.career = '';
    this.modality = '';
    this.salary = '';
    this.deadline = '';
    this.contactEmail = '';
    this.contactPhone = '';
    this.location = '';
  }

  startEdit(job: Job): void {
    this.editingId.set(job._id);
    this.formTouched = false;
    this.company = job.company ?? '';
    this.position = job.position ?? '';
    this.description = job.description ?? '';
    this.requirementsText = (job.requirements ?? []).join('\n');
    this.career = job.career ?? '';
    this.modality = (job.modality as JobModality) ?? '';
    this.salary = job.salary ?? '';
    this.deadline = job.deadline
      ? new Date(job.deadline).toISOString().slice(0, 10)
      : '';
    this.contactEmail = job.contactEmail ?? '';
    this.contactPhone = job.contactPhone ?? '';
    this.location = job.location ?? '';
  }

  get formInvalid(): boolean {
    return (
      this.company.trim().length === 0 ||
      this.position.trim().length === 0 ||
      this.deadline.trim().length === 0
    );
  }

  async save(): Promise<void> {
    this.formTouched = true;
    if (this.formInvalid) {
      this.notificationService.warning(
        'Completa los campos obligatorios: empresa, cargo y fecha de cierre',
      );
      return;
    }

    const payload: JobPayload = {
      company: this.company.trim(),
      position: this.position.trim(),
      description: this.description.trim() || undefined,
      requirements: this.requirementsText
        .split('\n')
        .map((r) => r.trim())
        .filter((r) => r.length > 0),
      career: this.career.trim() || undefined,
      modality: (this.modality as JobModality) || undefined,
      salary: this.salary.trim() || undefined,
      deadline: new Date(this.deadline).toISOString(),
      contactEmail: this.contactEmail.trim() || undefined,
      contactPhone: this.contactPhone.trim() || undefined,
      location: this.location.trim() || undefined,
    };

    this.formSubmitting.set(true);
    try {
      const editingId = this.editingId();
      const saved = editingId
        ? await lastValueFrom(this.jobsService.updateJob(editingId, payload))
        : await lastValueFrom(this.jobsService.createJob(payload));
      this.store.upsertJob(saved);
      this.notificationService.success(
        editingId ? 'Oferta actualizada correctamente' : 'Oferta creada correctamente',
      );
      this.startCreate();
    } catch (error: any) {
      this.notificationService.error(
        error?.error?.message ?? 'Error al guardar la oferta',
      );
    } finally {
      this.formSubmitting.set(false);
    }
  }

  async closeJob(job: Job): Promise<void> {
    const confirmed = await this.confirm(
      'Cerrar oferta',
      `¿Cerrar la oferta "${job.position}" de ${job.company}? Los estudiantes ya no podrán postular.`,
      'Cerrar oferta',
    );
    if (!confirmed) return;

    try {
      const updated = await lastValueFrom(this.jobsService.closeJob(job._id));
      this.store.upsertJob(updated);
      this.notificationService.success('Oferta cerrada');
    } catch (error: any) {
      this.notificationService.error(
        error?.error?.message ?? 'Error al cerrar la oferta',
      );
    }
  }

  async deleteJob(job: Job): Promise<void> {
    const confirmed = await this.confirm(
      'Eliminar oferta',
      `¿Eliminar definitivamente la oferta "${job.position}" de ${job.company}? Esta acción no se puede deshacer.`,
      'Eliminar',
    );
    if (!confirmed) return;

    try {
      await lastValueFrom(this.jobsService.deleteJob(job._id));
      this.store.removeJob(job._id);
      if (this.selectedOfferId() === job._id) {
        this.selectedOfferId.set('');
      }
      this.notificationService.success('Oferta eliminada');
    } catch (error: any) {
      this.notificationService.error(
        error?.error?.message ?? 'Error al eliminar la oferta',
      );
    }
  }

  private confirm(title: string, message: string, confirmText: string): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      maxWidth: '90vw',
      data: { title, message, confirmText, cancelText: 'Cancelar' },
    });
    return lastValueFrom(dialogRef.afterClosed());
  }

  // ------------------------------------------------------------------
  // Tab de postulaciones
  // ------------------------------------------------------------------

  selectedOffer(): Job | null {
    const id = this.selectedOfferId();
    if (!id) return null;
    return this.store.jobs().find((j) => j._id === id) ?? null;
  }

  async changeStatus(applicationIndex: number, status: ApplicationStatus): Promise<void> {
    const job = this.selectedOffer();
    if (!job) return;

    this.changingStatus.set(applicationIndex);
    try {
      const updated = await lastValueFrom(
        this.jobsService.updateApplicationStatus(job._id, applicationIndex, status),
      );
      this.store.upsertJob(updated);
      this.notificationService.success(
        `Estado actualizado a "${this.applicationLabels[status]}"`,
      );
    } catch (error: any) {
      this.notificationService.error(
        error?.error?.message ?? 'Error al actualizar el estado de la postulación',
      );
    } finally {
      this.changingStatus.set(null);
    }
  }
}