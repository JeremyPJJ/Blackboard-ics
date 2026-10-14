import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExamService, Exam } from '@core/services/exam.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-exam-taking-dialog',
  standalone: false,
  templateUrl: './exam-taking-dialog.component.html',
  styleUrls: ['./exam-taking-dialog.component.scss']
})
export class ExamTakingDialogComponent implements OnInit, OnDestroy {
  exam: Exam;
  answers: Record<number, any> = {};
  remainingSeconds: number;
  private timer: any = null;
  private lastSupervision: Record<string, number> = {};
  supervisionCount = 0;
  submitted = false;

  constructor(
    private dialogRef: MatDialogRef<ExamTakingDialogComponent>,
    private examService: ExamService,
    private notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: { exam: Exam },
  ) {
    this.exam = data.exam;
    this.remainingSeconds = (this.exam.duration || 30) * 60;
  }

  ngOnInit() {
    // Iniciar el intento en el backend ANTES de rendir (necesario para submit y supervisión)
    this.examService.startExam(this.exam._id).subscribe({
      next: (exam) => {
        this.exam = exam;
        this.startTimer();
        this.startSupervision();
      },
      error: () => {
        this.notificationService.error('No se pudo iniciar el examen. Intenta nuevamente.');
        this.dialogRef.close({ failed: true });
      },
    });
  }

  ngOnDestroy() {
    this.stopTimer();
    this.stopSupervision();
  }

  // ===== Temporizador =====
  private startTimer() {
    this.timer = setInterval(() => {
      this.remainingSeconds--;
      if (this.remainingSeconds <= 0) {
        this.stopTimer();
        this.timeExpired();
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // El tiempo se acabó: enviar lo que haya y cerrar el modal avisando
  private timeExpired() {
    if (this.submitted) return;
    this.submitted = true;
    this.stopSupervision();
    this.stopTimer();

    const answers: Record<string, any> = {};
    Object.keys(this.answers).forEach(k => { answers[k] = this.answers[Number(k)]; });

    this.examService.submitExam(this.exam._id, answers).subscribe({
      next: () => this.dialogRef.close({ submitted: true, timedOut: true }),
      error: (e) => {
        if (e.status === 404) {
          // Reintentar iniciando el intento
          this.examService.startExam(this.exam._id).subscribe({
            next: () => {
              this.examService.submitExam(this.exam._id, answers).subscribe({
                next: () => this.dialogRef.close({ submitted: true, timedOut: true }),
                error: () => this.dialogRef.close({ submitted: false, timedOut: true }),
              });
            },
            error: () => this.dialogRef.close({ submitted: false, timedOut: true }),
          });
        } else {
          this.dialogRef.close({ submitted: false, timedOut: true });
        }
      },
    });
  }

  get timeLabel(): string {
    const m = Math.floor(this.remainingSeconds / 60);
    const s = this.remainingSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // ===== Supervisión (requisitos.md: cambio de pestaña, pérdida de foco, salida de pantalla completa) =====
  private onVisibility = () => {
    if (document.hidden) {
      this.reportSupervision('tab_change', 'Cambio de pestaña detectado');
    }
  };

  private onBlur = () => {
    this.reportSupervision('focus_lost', 'Pérdida de foco de la ventana');
  };

  private onFullscreen = () => {
    if (!document.fullscreenElement) {
      this.reportSupervision('fullscreen_exit', 'Salida de pantalla completa');
    }
  };

  private startSupervision() {
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('fullscreenchange', this.onFullscreen);
    // Intentar entrar en pantalla completa (requisitos.md: examen solo en navegador supervisado)
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  private stopSupervision() {
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('fullscreenchange', this.onFullscreen);
  }

  private reportSupervision(type: string, details: string) {
    const now = Date.now();
    // Evitar duplicados en ráfaga (máx 1 cada 5s por tipo)
    if (now - (this.lastSupervision[type] || 0) < 5000) return;
    this.lastSupervision[type] = now;
    this.supervisionCount++;

    this.examService.reportSupervision(this.exam._id, type, details).subscribe({
      next: () => {
        this.notificationService.warning(this.exam.supervisionMessage || 'Evento de supervisión registrado');
      },
      error: () => {},
    });
  }

  // ===== Respuestas =====
  selectOption(qi: number, optionText: string) {
    this.answers[qi] = optionText;
  }

  toggleMulti(qi: number, optionText: string) {
    const list: string[] = Array.isArray(this.answers[qi]) ? [...this.answers[qi]] : [];
    const idx = list.indexOf(optionText);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(optionText);
    this.answers[qi] = list;
  }

  isMultiSelected(qi: number, optionText: string): boolean {
    return Array.isArray(this.answers[qi]) && this.answers[qi].includes(optionText);
  }

  complete(): boolean {
    return this.exam.questions.every((q, qi) => {
      const v = this.answers[qi];
      if (v === undefined || v === null) return false;
      if (Array.isArray(v)) return v.length > 0;
      return String(v).trim() !== '';
    });
  }

  submit() {
    if (this.submitted) return;
    this.submitted = true;
    this.stopTimer();

    const answers: Record<string, any> = {};
    Object.keys(this.answers).forEach(k => { answers[k] = this.answers[Number(k)]; });

    this.examService.submitExam(this.exam._id, answers).subscribe({
      next: () => {
        this.stopSupervision();
        this.dialogRef.close({ submitted: true });
      },
      error: (e) => {
        this.submitted = false;
        // Si el intento no existe (p.ej. caducó), reintentar iniciándolo
        if (e.status === 404) {
          this.examService.startExam(this.exam._id).subscribe({
            next: () => {
              this.examService.submitExam(this.exam._id, answers).subscribe({
                next: () => {
                  this.stopSupervision();
                  this.dialogRef.close({ submitted: true });
                },
                error: () => {
                  this.notificationService.error('Error al enviar el examen');
                  this.startTimer();
                },
              });
            },
            error: () => {
              this.notificationService.error('Error al reintentar el examen');
              this.startTimer();
            },
          });
        } else {
          this.notificationService.error('Error al enviar el examen');
          this.startTimer();
        }
      },
    });
  }
}