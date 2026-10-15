import { NgModule, ErrorHandler, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GlobalErrorHandler } from '@core/error-handler';

registerLocaleData(localeEs);

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';

// Shared Components (Standalone)
import { SkeletonComponent } from '@shared/components/skeleton.component';
import { LoadingMessageComponent } from '@shared/components/loading-message.component';
import { EmptyStateComponent } from '@shared/components/empty-state.component';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthInterceptor } from '@core/interceptors/auth.interceptor';
import { SharedModule } from '@shared/shared.module';
import { ProfileModule } from '@features/profile/profile.module';

import { LoginComponent } from '@features/auth/login/login.component';
import { UserListComponent } from '@features/users/user-list/user-list.component';
import { UserFormComponent } from '@features/users/user-form/user-form.component';
import { CourseListComponent } from '@features/courses/course-list/course-list.component';
import { CourseDetailComponent } from '@features/courses/course-detail/course-detail.component';
import { CourseFormComponent } from '@features/courses/course-form/course-form.component';
import { TaskListComponent } from '@features/tasks/task-list/task-list.component';
import { TaskDetailComponent } from '@features/tasks/task-detail/task-detail.component';
import { TaskCreateDialogComponent } from '@features/tasks/task-create-dialog/task-create-dialog.component';
import { TaskEditDialogComponent } from '@features/tasks/task-edit-dialog/task-edit-dialog.component';
import { GradeSubmissionDialogComponent } from '@features/tasks/grade-submission-dialog/grade-submission-dialog.component';
import { ViewSubmissionDialogComponent } from '@features/tasks/view-submission-dialog/view-submission-dialog.component';
import { ModifyAttendanceDialogComponent } from '@features/attendance/modify-attendance-dialog/modify-attendance-dialog.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { FilePreviewDialogComponent } from '@shared/components/file-preview-dialog.component';
import { LinkPreviewDialogComponent } from '@shared/components/link-preview-dialog.component';
import { StudentTasksComponent } from '@features/tasks/student-tasks/student-tasks.component';
import { StudentTaskDetailComponent } from '@features/tasks/student-task-detail/student-task-detail.component';
import { StudentProfileDialogComponent } from '@features/courses/course-detail/student-profile-dialog.component';
import { JoinResultDialogComponent } from '@features/dashboard/student/join-result-dialog.component';
import { MaterialEditDialogComponent } from '@features/courses/course-detail/material-edit-dialog.component';
import { MaterialCreateDialogComponent } from '@features/courses/course-detail/material-create-dialog.component';
import { TeacherStatsDialogComponent } from '@features/dashboard/admin/teacher-stats-dialog.component';
import { ForumsComponent } from '@features/forums/forums/forums.component';
import { ForumDetailComponent } from '@features/forums/forum-detail/forum-detail.component';
import { CreateForumDialogComponent } from '@features/forums/forums/create-forum-dialog.component';
import { GradebookDialogComponent } from '@features/courses/course-detail/gradebook-dialog.component';
import { SourceFilterPipe } from '@shared/pipes/source-filter.pipe';
import { ExamCreateDialogComponent } from '@features/exams/exam-create-dialog.component';
import { ExamTakingDialogComponent } from '@features/exams/exam-taking-dialog.component';
import { ExamSupervisionDialogComponent } from '@features/exams/exam-supervision-dialog.component';
import { MyGradesDialogComponent } from '@features/dashboard/student/my-grades-dialog.component';
import { SurveysComponent } from '@features/surveys/surveys.component';
import { SurveyCreateDialogComponent } from '@features/surveys/survey-create-dialog.component';
import { SurveyRespondDialogComponent } from '@features/surveys/survey-respond-dialog.component';
import { SurveyResultsDialogComponent } from '@features/surveys/survey-results-dialog.component';
import { AttendanceListComponent } from '@features/attendance/attendance-list/attendance-list.component';
import { AdminDashboardComponent } from '@features/dashboard/admin/admin-dashboard.component';
import { TeacherDashboardComponent } from '@features/dashboard/teacher/teacher-dashboard.component';
import { StudentDashboardComponent } from '@features/dashboard/student/student-dashboard.component';
import { StudentGradesComponent } from '@features/courses/student-grades/student-grades.component';
import { MeetingsSectionComponent } from '@features/courses/course-detail/meetings-section/meetings-section.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    UserListComponent,
    UserFormComponent,
    CourseListComponent,
    CourseDetailComponent,
    CourseFormComponent,
    TaskListComponent,
    TaskDetailComponent,
    AttendanceListComponent,
    AdminDashboardComponent,
    TeacherDashboardComponent,
    StudentDashboardComponent,
    TaskCreateDialogComponent,
    TaskEditDialogComponent,
    GradeSubmissionDialogComponent,
    ViewSubmissionDialogComponent,
    ModifyAttendanceDialogComponent,
    ConfirmDialogComponent,
    FilePreviewDialogComponent,
    LinkPreviewDialogComponent,
    StudentTasksComponent,
    StudentTaskDetailComponent,
    StudentProfileDialogComponent,
    JoinResultDialogComponent,
    MaterialEditDialogComponent,
    MaterialCreateDialogComponent,
    TeacherStatsDialogComponent,
    ForumsComponent,
    ForumDetailComponent,
    CreateForumDialogComponent,
    GradebookDialogComponent,
    MyGradesDialogComponent,
    ExamCreateDialogComponent,
    ExamTakingDialogComponent,
    ExamSupervisionDialogComponent,
    SurveysComponent,
    SurveyCreateDialogComponent,
    SurveyRespondDialogComponent,
    SurveyResultsDialogComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    SharedModule,
    ProfileModule,
    // Angular Material
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatTableModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatTabsModule,
    MatExpansionModule,
    MatCheckboxModule,
    // Shared Standalone Components
    SkeletonComponent,
    LoadingMessageComponent,
    EmptyStateComponent,
    SourceFilterPipe,
    StudentGradesComponent,
    MeetingsSectionComponent,
  ],
  providers: [
    {
      provide: LOCALE_ID,
      useValue: 'es',
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
