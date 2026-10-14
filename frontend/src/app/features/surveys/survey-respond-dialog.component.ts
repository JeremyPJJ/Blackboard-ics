import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Survey, SurveyQuestion } from '@core/services/survey.service';
import { SurveyService } from '@core/services/survey.service';

@Component({
  selector: 'app-survey-respond-dialog',
  standalone: false,
  templateUrl: './survey-respond-dialog.component.html',
  styleUrls: ['./survey-respond-dialog.component.scss']
})
export class SurveyRespondDialogComponent {
  survey: Survey;
  answers: Record<number, any> = {};
  multi: Record<number, string[]> = {};

  constructor(
    private dialogRef: MatDialogRef<SurveyRespondDialogComponent>,
    private surveyService: SurveyService,
    @Inject(MAT_DIALOG_DATA) public data: { survey: Survey },
  ) {
    this.survey = data.survey;
  }

  scaleValues(q: SurveyQuestion): number[] {
    const min = q.minScale || 1;
    const max = q.maxScale || 5;
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }

  toggleMulti(qi: number, option: string) {
    const list = this.multi[qi] || [];
    const idx = list.indexOf(option);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(option);
    this.multi[qi] = [...list];
    this.answers[qi] = [...list];
  }

  complete(): boolean {
    return this.survey.questions.every((q, qi) => {
      const v = this.answers[qi];
      if (!q.required) return true;
      if (Array.isArray(v)) return v.length > 0;
      return v !== undefined && v !== null && String(v).trim() !== '';
    });
  }

  submit() {
    const answers: any = {};
    Object.keys(this.answers).forEach((k) => {
      answers[k] = this.answers[Number(k)];
    });
    this.surveyService.submitResponse(this.survey._id, answers).subscribe({
      next: () => this.dialogRef.close(true),
      error: (e) => {
        if (e.status === 409) this.dialogRef.close(true);
      },
    });
  }
}