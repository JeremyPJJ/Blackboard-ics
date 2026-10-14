import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExamService, Exam } from '@core/services/exam.service';

interface QOption { text: string; isCorrect: boolean; }
interface QBuilder {
  text: string;
  type: string; // opcion_multiple | verdadero_falso | completar | desarrollo
  options: QOption[];
  correctAnswer: string;
  points: number;
}

@Component({
  selector: 'app-exam-create-dialog',
  standalone: false,
  templateUrl: './exam-create-dialog.component.html',
  styleUrls: ['./exam-create-dialog.component.scss']
})
export class ExamCreateDialogComponent {
  title = '';
  description = '';
  duration = 30;
  maxAttempts = 1;
  passingScore = 11;
  supervisionMessage = 'Estás siendo supervisado. Cambiar de pestaña o perder el foco quedará registrado.';
  questions: QBuilder[] = [];
  isEdit = false;
  private examId: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<ExamCreateDialogComponent>,
    private examService: ExamService,
    @Inject(MAT_DIALOG_DATA) public data: { courseId: string; weekNumber?: number; exam?: Exam },
  ) {
    if (data?.exam) {
      this.isEdit = true;
      this.examId = data.exam._id;
      this.title = data.exam.title;
      this.description = data.exam.description || '';
      this.duration = data.exam.duration;
      this.maxAttempts = data.exam.maxAttempts;
      this.passingScore = data.exam.passingScore || 11;
      this.supervisionMessage = data.exam.supervisionMessage || this.supervisionMessage;
      this.questions = (data.exam.questions || []).map(q => ({
        text: q.text,
        type: q.type,
        options: (q.options || []).map(o => ({ text: o.text, isCorrect: !!o.isCorrect })),
        correctAnswer: q.correctAnswer || '',
        points: q.points,
      }));
    } else {
      this.addQuestion();
    }
  }

  addQuestion() {
    this.questions.push({
      text: '',
      type: 'opcion_multiple',
      options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }],
      correctAnswer: '',
      points: 1,
    });
  }

  removeQuestion(i: number) {
    this.questions.splice(i, 1);
  }

  onTypeChange(q: QBuilder) {
    if (q.type === 'verdadero_falso') {
      q.options = [
        { text: 'Verdadero', isCorrect: true },
        { text: 'Falso', isCorrect: false },
      ];
    } else if (q.type === 'opcion_multiple') {
      q.options = [
        { text: q.options[0]?.text || '', isCorrect: q.options[0]?.isCorrect ?? true },
        { text: q.options[1]?.text || '', isCorrect: q.options[1]?.isCorrect ?? false },
        { text: q.options[2]?.text || '', isCorrect: q.options[2]?.isCorrect ?? false },
        { text: q.options[3]?.text || '', isCorrect: q.options[3]?.isCorrect ?? false },
      ];
    } else {
      q.options = [];
    }
  }

  validQuestions(): boolean {
    return this.questions.every(q => {
      if (!q.text.trim() || !q.points || q.points <= 0) return false;
      if (q.type === 'opcion_multiple' || q.type === 'verdadero_falso') {
        return q.options.some(o => o.isCorrect) && q.options.every(o => o.text.trim() !== '');
      }
      if (q.type === 'completar') return q.correctAnswer.trim() !== '';
      return true; // desarrollo
    });
  }

  save() {
    if (!this.title || !this.validQuestions()) return;

    const payload = {
      title: this.title.trim(),
      description: this.description,
      weekNumber: Number(this.data.weekNumber) || 1,
      sessionNumber: 1,
      duration: Number(this.duration) || 30,
      maxAttempts: Number(this.maxAttempts) || 1,
      passingScore: Number(this.passingScore) || 11,
      supervisionMessage: this.supervisionMessage,
      status: 'publicado',
      questions: this.questions.map(q => {
        const base: any = { text: q.text.trim(), type: q.type, points: Number(q.points) || 1 };
        if (q.type === 'opcion_multiple' || q.type === 'verdadero_falso') {
          base.options = q.options.map(o => ({ text: o.text.trim(), isCorrect: o.isCorrect }));
        }
        if (q.type === 'completar') base.correctAnswer = q.correctAnswer.trim();
        return base;
      }),
    };

    if (this.isEdit && this.examId) {
      this.examService.updateExam(this.examId, payload).subscribe({
        next: (exam) => this.dialogRef.close(exam),
        error: () => this.dialogRef.close(null),
      });
    } else {
      this.examService.createExam({ ...payload, courseId: this.data.courseId }).subscribe({
        next: (exam) => this.dialogRef.close(exam),
        error: () => this.dialogRef.close(null),
      });
    }
  }
}