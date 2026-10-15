import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProfileDialogComponent } from './profile-dialog/profile-dialog.component';

/**
 * Perfil (Spec: Profile UI — dialog from top navigation "Mi perfil").
 *
 * En este slice el diálogo se abre desde la barra de navegación vía MatDialog
 * (no es una ruta navegable). En el Slice 7 (lazy migration) se migrará a un
 * routing module lazy (task 7.9) para que su chunk sea independiente.
 */
@NgModule({
  declarations: [ProfileDialogComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  exports: [ProfileDialogComponent],
})
export class ProfileModule { }
