import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { AuthGuard } from '@core/guards/auth.guard';
import { RoomComponent } from './room/room.component';
import { MeetingTitleDialogComponent } from './meeting-title-dialog/meeting-title-dialog.component';

const routes: Routes = [
  {
    path: ':courseId/room',
    component: RoomComponent,
    canActivate: [AuthGuard],
    data: { title: 'Sala de reuniones' },
  },
];

@NgModule({
  declarations: [RoomComponent, MeetingTitleDialogComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    DragDropModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    FormsModule,
  ],
})
export class MeetingsModule {}