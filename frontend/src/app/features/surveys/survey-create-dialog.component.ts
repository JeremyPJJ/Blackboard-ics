import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SurveyService, Survey } from '@core/services/survey.service';
import { AuthService } from '@core/services/auth.service';

interface OptionItem {
  text: string;
}

interface QBuilder {
  text: string;
  type: string;
  options: OptionItem[];
  required: boolean;
  minScale: number;
  maxScale: number;
}

@Component({
  selector: 'app-survey-create-dialog',
  standalone: false,
  templateUrl: './survey-create-dialog.component.html',
  styleUrls: ['./survey-create-dialog.component.scss']
})
export class SurveyCreateDialogComponent {
  title = '';
  description = '';
  targetRole = 'estudiante';
  isAnonymous = false;
  startDate: Date = new Date();
  endDate: Date = new Date(Date.now() + 7 * 86400000);
  questions: QBuilder[] = [];
  isEdit = false;
  private surveyId: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<SurveyCreateDialogComponent>,
    private surveyService: SurveyService,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: { survey?: Survey } = {},
  ) {
    if (data?.survey) {
      this.isEdit = true;
      this.surveyId = data.survey._id;
      this.title = data.survey.title;
      this.description = data.survey.description || '';
      this.targetRole = data.survey.targetRole || 'estudiante';
      this.isAnonymous = data.survey.isAnonymous;
      this.startDate = new Date(data.survey.startDate);
      this.endDate = new Date(data.survey.endDate);
      this.questions = (data.survey.questions || []).map((q: any) => ({
        text: q.text || '',
        type: q.type || 'texto',
        options: (q.options || []).map((o: any) => ({ text: typeof o === 'string' ? o : (o.text || '') })),
        required: !!q.required,
        minScale: q.minScale || 1,
        maxScale: q.maxScale || 5,
      }));
    } else {
      this.addQuestion();
    }
  }

  get isTeacherOnly(): boolean {
    return this.authService.getCurrentUser()?.role === 'docente';
  }

  addQuestion() {
    this.questions.push({ text: '', type: 'texto', options: [{ text: '' }, { text: '' }], required: true, minScale: 1, maxScale: 5 });
  }

  removeQuestion(i: number) {
    this.questions.splice(i, 1);
  }

  validQuestions(): boolean {
    return this.questions.every((q) => {
      if (!q.text.trim()) return false;
      if (q.type === 'seleccion_unica' || q.type === 'seleccion_multiple') {
        return q.options.some((o) => o.text.trim() !== '');
      }
      return true;
    });
  }

  save(): void {
    const questions = this.questions.map((q) => {
      const base: any = { text: q.text.trim(), type: q.type, required: q.required };
      if (q.type === 'seleccion_unica' || q.type === 'seleccion_multiple') {
        base.options = q.options.filter((o) => o.text.trim() !== '').map((o) => ({ text: o.text.trim() }));
      }
      if (q.type === 'escala') {
        base.minScale = Number(q.minScale) || 1;
        base.maxScale = Number(q.maxScale) || 5;
      }
      return base;
    });

    const payload = {
      title: this.title.trim(),
      description: this.description,
      type: 'cerrada',
      targetRole: this.isTeacherOnly ? 'estudiante' : this.targetRole,
      isAnonymous: this.isAnonymous,
      startDate: this.startDate,
      endDate: this.endDate,
      isActive: true,
      questions,
    };

    if (this.isEdit && this.surveyId) {
      this.surveyService.updateSurvey(this.surveyId, payload).subscribe({
        next: (s) => this.dialogRef.close(s),
        error: () => this.dialogRef.close(null),
      });
    } else {
      this.surveyService.createSurvey(payload).subscribe({
        next: (s) => this.dialogRef.close(s),
        error: () => this.dialogRef.close(null),
      });
    }
  }
}