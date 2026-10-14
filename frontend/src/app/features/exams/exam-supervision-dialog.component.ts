import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExamService, Exam } from '@core/services/exam.service';
import { UserService } from '@core/services/user.service';

@Component({
  selector: 'app-exam-supervision-dialog',
  standalone: false,
  templateUrl: './exam-supervision-dialog.component.html',
  styleUrls: ['./exam-supervision-dialog.component.scss']
})
export class ExamSupervisionDialogComponent implements OnInit {
  exam: Exam | null = null;
  studentMap: Record<string, string> = {};
  isLoading = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { examId: string; title: string },
    private examService: ExamService,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.isLoading = true;
    this.examService.getExam(this.data.examId).subscribe({
      next: (exam) => {
        this.exam = exam;
        this.loadStudents();
      },
      error: () => this.isLoading = false,
    });
  }

  private loadStudents() {
    if (!this.exam) { this.isLoading = false; return; }
    const ids = new Set<string>();
    this.exam.attempts.forEach(a => ids.add(a.studentId?.toString()));
    if (ids.size === 0) { this.isLoading = false; return; }

    this.userService.getUsers().subscribe({
      next: (users) => {
        users.forEach(u => {
          if (ids.has(u._id)) this.studentMap[u._id] = `${u.names} ${u.lastNames}`.trim();
        });
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  studentName(id: string): string {
    return this.studentMap[id] || id;
  }

  attemptScore(attempt: any): string {
    if (attempt.score === undefined || attempt.score === null) return '—';
    return `${attempt.score} / ${attempt.maxScore || '—'}`;
  }

  eventLabel(type: string): string {
    const labels: Record<string, string> = {
      tab_change: 'Cambio de pestaña',
      focus_lost: 'Pérdida de foco',
      fullscreen_exit: 'Salida de pantalla completa',
    };
    return labels[type] || type;
  }

  removeAttempt(attempt: any) {
    const name = this.studentName(attempt.studentId);
    if (!confirm(`¿Eliminar el intento de ${name}? Podrá volver a rendir el examen.`)) return;

    this.examService.removeAttempt(this.data.examId, attempt.studentId).subscribe({
      next: () => {
        this.load();
      },
      error: () => {},
    });
  }
}