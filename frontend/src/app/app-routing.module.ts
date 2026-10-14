import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from '@features/auth/login/login.component';
import { UserListComponent } from '@features/users/user-list/user-list.component';
import { UserFormComponent } from '@features/users/user-form/user-form.component';
import { CourseListComponent } from '@features/courses/course-list/course-list.component';
import { CourseDetailComponent } from '@features/courses/course-detail/course-detail.component';
import { CourseFormComponent } from '@features/courses/course-form/course-form.component';
import { TaskListComponent } from '@features/tasks/task-list/task-list.component';
import { TaskDetailComponent } from '@features/tasks/task-detail/task-detail.component';
import { AttendanceListComponent } from '@features/attendance/attendance-list/attendance-list.component';
import { ForumsComponent } from '@features/forums/forums/forums.component';
import { ForumDetailComponent } from '@features/forums/forum-detail/forum-detail.component';
import { SurveysComponent } from '@features/surveys/surveys.component';
import { StudentTasksComponent } from '@features/tasks/student-tasks/student-tasks.component';
import { StudentTaskDetailComponent } from '@features/tasks/student-task-detail/student-task-detail.component';
import { AdminDashboardComponent } from '@features/dashboard/admin/admin-dashboard.component';
import { TeacherDashboardComponent } from '@features/dashboard/teacher/teacher-dashboard.component';
import { StudentDashboardComponent } from '@features/dashboard/student/student-dashboard.component';
import { AuthGuard } from '@core/guards/auth.guard';
import { RoleGuard } from '@core/guards/role.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent, data: { title: 'Iniciar Sesión' } },
  { 
    path: 'dashboard', 
    canActivate: [AuthGuard],
    children: [
      { 
        path: '', 
        canActivate: [RoleGuard],
        data: { roles: ['super_admin', 'unidad_academica', 'docente', 'estudiante'] },
        children: [
          { path: '', redirectTo: 'admin', pathMatch: 'full' },
          { 
            path: 'admin', 
            component: AdminDashboardComponent,
            canActivate: [RoleGuard],
            data: { roles: ['super_admin', 'unidad_academica', 'secretaria', 'soporte'], title: 'Dashboard Administrativo' }
          },
          { 
            path: 'teacher', 
            component: TeacherDashboardComponent,
            canActivate: [RoleGuard],
            data: { roles: ['docente'], title: 'Dashboard Docente' }
          },
          { 
            path: 'student', 
            component: StudentDashboardComponent,
            canActivate: [RoleGuard],
            data: { roles: ['estudiante'], title: 'Mi Aprendizaje' }
          }
        ]
      }
    ]
  },
  { path: 'users', component: UserListComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['super_admin', 'unidad_academica'], title: 'Gestión de Usuarios' } },
  { path: 'users/new', component: UserFormComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['super_admin', 'unidad_academica'], title: 'Nuevo Usuario' } },
  { path: 'users/:id/edit', component: UserFormComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['super_admin', 'unidad_academica'], title: 'Editar Usuario' } },
  { path: 'courses', component: CourseListComponent, canActivate: [AuthGuard], data: { title: 'Gestión de Cursos' } },
  { path: 'courses/new', component: CourseFormComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['super_admin', 'unidad_academica', 'docente'], title: 'Nuevo Curso' } },
  { path: 'courses/:id', component: CourseDetailComponent, canActivate: [AuthGuard], data: { title: 'Detalle del Curso' } },
  { path: 'courses/:id/edit', component: CourseFormComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['super_admin', 'unidad_academica', 'docente'], title: 'Editar Curso' } },
  { path: 'courses/:courseId/tasks', component: TaskListComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['super_admin', 'unidad_academica', 'secretaria', 'soporte', 'docente'], title: 'Tareas del Curso' } },
  { path: 'courses/:courseId/tasks/:id', component: TaskDetailComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['super_admin', 'unidad_academica', 'secretaria', 'soporte', 'docente'], title: 'Detalle de la Tarea' } },
  { path: 'courses/:courseId/attendance', component: AttendanceListComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['super_admin', 'unidad_academica', 'docente'], title: 'Registro de Asistencia' } },
  { path: 'courses/:courseId/forums', component: ForumsComponent, canActivate: [AuthGuard], data: { title: 'Foros del Curso' } },
  { path: 'courses/:courseId/forums/:forumId', component: ForumDetailComponent, canActivate: [AuthGuard], data: { title: 'Foro' } },
  { path: 'my-tasks', component: StudentTasksComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['estudiante'], title: 'Mis Tareas' } },
  { path: 'my-tasks/:id', component: StudentTaskDetailComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['estudiante'], title: 'Detalle de Tarea' } },
  { path: 'surveys', component: SurveysComponent, canActivate: [AuthGuard], data: { title: 'Encuestas' } },
  {
    path: 'messaging',
    loadChildren: () =>
      import('@features/messaging/messaging.module').then((m) => m.MessagingModule),
    data: { title: 'Mensajería' },
  },
  {
    path: 'meetings',
    loadChildren: () =>
      import('@features/meetings/meetings.module').then((m) => m.MeetingsModule),
    data: { title: 'Sala de reuniones' },
  },
  {
    path: 'imports',
    loadChildren: () =>
      import('@features/imports/imports.module').then((m) => m.ImportsModule),
    data: { title: 'Importar participantes' },
  },
  {
    path: 'jobs',
    loadChildren: () =>
      import('@features/jobs/jobs.module').then((m) => m.JobsModule),
    data: { title: 'Ofertas laborales' },
  },
  {
    path: 'trash',
    loadComponent: () =>
      import('@features/trash/trash-list/trash-list.component').then((m) => m.TrashListComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: {
      roles: ['super_admin', 'unidad_academica', 'secretaria', 'soporte'],
      title: 'Papelera',
    },
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
