import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SurveyService, Survey } from '@core/services/survey.service';
import { SurveysStore } from '@core/services/surveys.store';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { SurveyCreateDialogComponent } from './survey-create-dialog.component';
import { SurveyRespondDialogComponent } from './survey-respond-dialog.component';
import { SurveyResultsDialogComponent } from './survey-results-dialog.component';

@Component({
  selector: 'app-surveys',
  standalone: false,
  templateUrl: './surveys.component.html',
  styleUrls: ['./surveys.component.scss'],
})
export class SurveysComponent implements OnInit {
  toRespond: Survey[] = [];
  mine: Survey[] = [];
  isLoading = true;

  constructor(
    private surveyService: SurveyService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private surveysStore: SurveysStore,
  ) {}

  ngOnInit() {
    this.loadSurveys();
  }

  get myRole(): string {
    return this.authService.getCurrentUser()?.role || '';
  }

  can(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  loadSurveys() {
    this.isLoading = true;
    this.surveyService.getSurveys().subscribe({
      next: (surveys) => {
        const me = this.authService.getCurrentUser();
        const now = new Date();
        this.toRespond = surveys.filter(
          (s) =>
            (s.targetRole === 'todos' || s.targetRole === this.myRole) &&
            s.isActive !== false &&
            new Date(s.startDate) <= now &&
            new Date(s.endDate) >= now &&
            !(s.responses || []).some((r: any) => r.userId?.toString() === me?._id)
        );
        this.mine = surveys.filter((s) => s.createdBy === me?._id);
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  hasResponded(survey: Survey): boolean {
    const me = this.authService.getCurrentUser();
    return (survey.responses || []).some((r: any) => r.userId?.toString() === me?._id);
  }

  openCreate() {
    const dialogRef = this.dialog.open(SurveyCreateDialogComponent, {
      width: '640px',
      maxWidth: '94vw',
    });
    dialogRef.afterClosed().subscribe((created) => {
      if (created) {
        this.loadSurveys();
        this.notificationService.success('Encuesta creada');
      }
    });
  }

  openEdit(survey: Survey) {
    const dialogRef = this.dialog.open(SurveyCreateDialogComponent, {
      width: '640px',
      maxWidth: '94vw',
      data: { survey },
    });
    dialogRef.afterClosed().subscribe((updated) => {
      if (updated) {
        this.loadSurveys();
        this.notificationService.success('Encuesta actualizada');
      }
    });
  }

  openRespond(survey: Survey) {
    const dialogRef = this.dialog.open(SurveyRespondDialogComponent, {
      width: '600px',
      maxWidth: '94vw',
      data: { survey },
    });
    dialogRef.afterClosed().subscribe((submitted) => {
      if (submitted) {
        // Spec N7: el badge decrementa sin navegar (piso 0; refreshBadges en
        // navegación reconcilia con REST).
        this.surveysStore.decrementPending();
        this.loadSurveys();
        this.notificationService.success('Encuesta enviada');
      }
    });
  }

  openResults(survey: Survey) {
    this.dialog.open(SurveyResultsDialogComponent, {
      width: '640px',
      maxWidth: '94vw',
      data: { surveyId: survey._id, title: survey.title, anonymous: survey.isAnonymous },
    });
  }

  isSurveyActive(survey: Survey): boolean {
    const now = new Date();
    return new Date(survey.endDate) >= now && survey.isActive !== false;
  }

  targetRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      estudiante: 'Estudiantes',
      docente: 'Docentes',
      todos: 'Todos',
    };
    return labels[role] || role || '—';
  }

  percentFilled(survey: Survey): number {
    if (!survey.maxResponses) return 0;
    return Math.round(((survey.responses?.length || 0) / survey.maxResponses) * 100);
  }

  progressWidth(survey: Survey): string {
    return this.percentFilled(survey) + '%';
  }
}