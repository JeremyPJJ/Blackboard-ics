import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import { TaskService } from '@core/services/task.service';
import { FileService } from '@core/services/file.service';
import { NotificationService } from '@core/services/notification.service';
import { Task, TaskSubmission } from '@core/models';

@Component({
  selector: 'app-student-task-detail',
  standalone: false,
  templateUrl: './student-task-detail.component.html',
  styleUrls: ['./student-task-detail.component.scss']
})
export class StudentTaskDetailComponent implements OnInit, OnDestroy {
  task: Task | null = null;
  isLoading = true;
  comments = '';
  selectedFile: File | null = null;
  isSubmitting = false;
  submission: TaskSubmission | null = null;
  submissionStatus: 'pendiente' | 'entregado' | 'calificado' = 'pendiente';
  taskId: string;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private taskService: TaskService,
    public fileService: FileService,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {
    this.taskId = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit() {
    this.loadTask();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTask() {
    this.isLoading = true;
    this.taskService.getTaskById(this.taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (task) => {
          this.task = task;
          this.loadMySubmission();
          this.isLoading = false;
        },
        error: () => this.isLoading = false,
      });
  }

  loadMySubmission() {
    const user = this.authService.getCurrentUser();
    this.taskService.getSubmissions(this.taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (submissions) => {
          this.submission = submissions.find(s => s.studentId?.toString() === user?._id) || null;
          if (this.submission) {
            this.submissionStatus =
              (this.submission.status === 'revisado' || this.submission.score !== undefined)
                ? 'calificado'
                : 'entregado';
            if (this.submission.comments) this.comments = this.submission.comments;
          }
        },
        error: () => {},
      });
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) this.selectedFile = file;
  }

  clearFile() {
    this.selectedFile = null;
    const input = document.getElementById('taskFile') as HTMLInputElement;
    if (input) input.value = '';
  }

  downloadFile(fileId: string, index: number): void {
    this.fileService.download(fileId, `mi_entrega_${index + 1}`);
  }

  onSubmit() {
    if (!this.task || this.isSubmitting) return;
    if (!this.comments && !this.selectedFile) return;

    this.isSubmitting = true;

    const finish = () => {
      this.loadMySubmission();
      this.selectedFile = null;
      this.isSubmitting = false;
      this.notificationService.success('Tarea entregada correctamente');
    };

    if (this.selectedFile) {
      // Subir archivo y luego registrar la entrega
      this.fileService.upload(this.selectedFile, 'task_submission', this.taskId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (uploaded) => {
            const fileIds = [...(this.submission?.fileIds || []), uploaded._id];
            this.taskService.submitTask(this.taskId, fileIds, this.comments)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => finish(),
                error: (error) => {
                  console.error('Error submitting task:', error);
                  this.notificationService.error('Error al entregar la tarea');
                  this.isSubmitting = false;
                },
              });
          },
          error: (error) => {
            console.error('Error uploading file:', error);
            this.notificationService.error('Error al subir el archivo');
            this.isSubmitting = false;
          },
        });
    } else {
      this.taskService.submitTask(this.taskId, this.submission?.fileIds || [], this.comments)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => finish(),
          error: (error) => {
            console.error('Error submitting task:', error);
            this.notificationService.error('Error al entregar la tarea');
            this.isSubmitting = false;
          },
        });
    }
  }
}