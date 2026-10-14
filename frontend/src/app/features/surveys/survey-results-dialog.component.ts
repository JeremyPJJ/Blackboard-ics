import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SurveyService } from '@core/services/survey.service';

@Component({
  selector: 'app-survey-results-dialog',
  standalone: false,
  templateUrl: './survey-results-dialog.component.html',
  styleUrls: ['./survey-results-dialog.component.scss']
})
export class SurveyResultsDialogComponent implements OnInit {
  view: 'summary' | 'users' = 'summary';
  stats: any = null;
  responses: any[] = [];
  questions: any[] = [];

  constructor(
    private surveyService: SurveyService,
    @Inject(MAT_DIALOG_DATA) public data: { surveyId: string; title: string; anonymous: boolean },
  ) {}

  get anonymous(): boolean {
    return this.data.anonymous;
  }

  get title(): string {
    return this.data.title;
  }

  ngOnInit() {
    this.surveyService.getStatistics(this.data.surveyId).subscribe((stats) => (this.stats = stats));
    this.surveyService.getResponses(this.data.surveyId).subscribe((survey) => {
      this.responses = survey.responses || [];
      this.questions = survey.questions || [];
    });
  }

  distribution(dist: any): { key: string; value: number }[] {
    return Object.entries(dist || {}).map(([key, value]) => ({ key, value: value as number }));
  }

  barWidth(value: number, total: number): string {
    if (!total) return '0%';
    return Math.round((value / total) * 100) + '%';
  }

  percent(value: number, total: number): number {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  }

  formatAnswer(a: any): string {
    if (a === undefined || a === null) return '—';
    if (Array.isArray(a)) return a.join(', ');
    return String(a);
  }
}