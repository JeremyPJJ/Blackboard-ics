import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthGuard } from '@core/guards/auth.guard';
import { MessagingComponent } from './messaging.component';
import { ConversationListComponent } from './components/conversation-list/conversation-list.component';
import { ConversationDetailComponent } from './components/conversation-detail/conversation-detail.component';
import { MessageInputComponent } from './components/message-input/message-input.component';
import { NewConversationDialogComponent } from './components/new-conversation-dialog/new-conversation-dialog.component';

const routes: Routes = [
  {
    path: '',
    component: MessagingComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  declarations: [
    MessagingComponent,
    ConversationListComponent,
    ConversationDetailComponent,
    MessageInputComponent,
    NewConversationDialogComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatSelectModule,
    MatCheckboxModule,
  ],
})
export class MessagingModule {}
