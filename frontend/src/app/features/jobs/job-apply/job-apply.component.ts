import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { JobsStore } from '../store/jobs.store';
import { JobsService } from '../services/jobs.service';
import { FileService } from '@core/services/file.service';
import { NotificationService } from '@core/services/notification.service';
import { APPLICATION_STATUS_LABELS } from '../models/job.model';

/**
 * Postulación a una oferta (Spec: Job Offers — "Student applies to a job").
 *
 * El estudiante envía su carta de presentación y, opcionalmente, un CV
 * (R6-5): el archivo se sube primero vía FileService y su fileId viaja como
 * `attachments[0]` en la postulación. La postulación se almacena con estado
 * `POSTULADO` y se muestra un mensaje de confirmación. El estado posterior
 * (p. ej. FINALISTA) lo actualiza el usuario autorizado desde job-admin y el
 * estudiante lo ve en job-detail / job-apply.
 */
@Component({
  selector: 'app-job-apply',
  standalone: false,
  templateUrl: './job-apply.component.html',
  styleUrls: ['./job-apply.component.scss'],
})
export class JobApplyComponent implements OnInit {
  readonly job = this.store.selectedJob;
  readonly submitting = this.store.submitting;
  readonly confirmation = this.store.confirmation;
  readonly applicationLabels = APPLICATION_STATUS_LABELS;

  coverLetter = '';
  coverLetterTouched = false;

  // R6-5: CV adjunto opcional
  selectedFile: File | null = null;
  fileError: string | null = null;
  uploading = false;

  private readonly allowedExtensions = ['doc', 'docx', 'pdf', 'jpg', 'jpeg', 'png'];
  private readonly allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
  ];
  private readonly maxSizeBytes = 5 * 1024 * 1024; // 5 MB

  constructor(
    readonly store: JobsStore,
    private route: ActivatedRoute,
    private router: Router,
    private jobsService: JobsService,
    private fileService: FileService,
    private notificationService: NotificationService,
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.job() || this.job()!._id !== id) {
      this.store.setLoading(true);
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
  }

  get coverLetterInvalid(): boolean {
    return this.coverLetterTouched && this.coverLetter.trim().length === 0;
  }

  /** Valida extensión/MIME y tamaño (≤5 MB) antes de permitir adjuntar el CV. */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = null;
    this.fileError = null;

    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    const extensionOk = this.allowedExtensions.includes(extension);
    const mimeOk =
      !file.type ||
      file.type === 'application/octet-stream' ||
      this.allowedMimeTypes.includes(file.type);

    if (!extensionOk || !mimeOk) {
      this.fileError =
        'Tipo de archivo no permitido. Usa PDF, Word (doc/docx) o imagen (jpg/jpeg/png).';
      this.notificationService.error(this.fileError);
      input.value = '';
      return;
    }

    if (file.size > this.maxSizeBytes) {
      this.fileError = 'El archivo supera el tamaño máximo de 5 MB.';
      this.notificationService.error(this.fileError);
      input.value = '';
      return;
    }

    this.selectedFile = file;
  }

  clearFile(): void {
    this.selectedFile = null;
    this.fileError = null;
    const input = document.getElementById('cvFile') as HTMLInputElement;
    if (input) input.value = '';
  }

  async submit(): Promise<void> {
    const job = this.job();
    if (!job) return;

    this.coverLetterTouched = true;
    if (this.coverLetter.trim().length === 0) {
      return;
    }

    this.store.setSubmitting(true);
    this.store.setError(null);
    try {
      let attachments: string[] = [];
      if (this.selectedFile) {
        this.uploading = true;
        try {
          const uploaded = await lastValueFrom(
            this.fileService.upload(this.selectedFile, 'job_application', job._id),
          );
          attachments = [uploaded._id];
        } catch (error: any) {
          const message = error?.error?.message ?? 'Error al subir el CV. Intenta nuevamente.';
          this.store.setError(message);
          this.notificationService.error(message);
          return;
        } finally {
          this.uploading = false;
        }
      }

      const updated = await lastValueFrom(
        this.jobsService.applyToJob(job._id, this.coverLetter.trim(), attachments),
      );
      this.store.setSelectedJob(updated);
      this.store.setConfirmation(
        '¡Postulación enviada correctamente! Quedó registrada con estado "Postulado".',
      );
      this.notificationService.success('Postulación enviada correctamente');
    } catch (error: any) {
      const message = error?.error?.message ?? 'Error al enviar la postulación';
      if (message.includes('Ya postulaste')) {
        this.store.setConfirmation(message);
      } else {
        this.store.setError(message);
        this.notificationService.error(message);
      }
    } finally {
      this.store.setSubmitting(false);
    }
  }

  goBackToDetail(): void {
    const id = this.job()?._id;
    if (!id) return;
    void this.router.navigate(['/jobs', id]);
  }
}