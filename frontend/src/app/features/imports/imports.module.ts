import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthGuard } from '@core/guards/auth.guard';
import { RoleGuard } from '@core/guards/role.guard';
import { ImportPreviewComponent } from './import-preview/import-preview.component';
import { ImportConfirmComponent } from './import-confirm/import-confirm.component';

const routes: Routes = [
  {
    path: ':courseId',
    component: ImportPreviewComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      roles: ['super_admin', 'unidad_academica', 'secretaria', 'docente'],
      title: 'Importar participantes',
    },
  },
  {
    path: ':courseId/confirm',
    component: ImportConfirmComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      roles: ['super_admin', 'unidad_academica', 'secretaria', 'docente'],
      title: 'Confirmar importación',
    },
  },
];

@NgModule({
  declarations: [ImportPreviewComponent, ImportConfirmComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
})
export class ImportsModule {}