import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { AuthGuard } from '@core/guards/auth.guard';
import { RoleGuard } from '@core/guards/role.guard';
import { JobListComponent } from './job-list/job-list.component';
import { JobDetailComponent } from './job-detail/job-detail.component';
import { JobApplyComponent } from './job-apply/job-apply.component';
import { JobAdminComponent } from './job-admin/job-admin.component';

/**
 * Ofertas laborales (Spec: Job Offers). Módulo lazy: la ruta `/jobs` se
 * carga con `loadChildren` desde app-routing.module.ts.
 *
 * - Estudiantes: listado de ofertas activas + detalle + postulación.
 * - Usuarios autorizados: gestión (crear/editar/cerrar/eliminar) y revisión
 *   de postulaciones (cambio de estado a FINALISTA, etc.).
 */
const routes: Routes = [
  {
    path: '',
    component: JobListComponent,
    canActivate: [AuthGuard],
    data: { title: 'Ofertas laborales' },
  },
  {
    path: 'admin',
    component: JobAdminComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      roles: ['super_admin', 'unidad_academica', 'secretaria', 'soporte', 'docente'],
      title: 'Gestión de ofertas laborales',
    },
  },
  {
    path: ':id/apply',
    component: JobApplyComponent,
    canActivate: [AuthGuard],
    data: { title: 'Postular a oferta laboral' },
  },
  {
    path: ':id',
    component: JobDetailComponent,
    canActivate: [AuthGuard],
    data: { title: 'Detalle de oferta laboral' },
  },
];

@NgModule({
  declarations: [JobListComponent, JobDetailComponent, JobApplyComponent, JobAdminComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatTooltipModule,
    MatDialogModule,
    MatDividerModule,
  ],
})
export class JobsModule {}