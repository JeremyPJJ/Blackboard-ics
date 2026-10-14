import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessagingStore } from '../../store/messaging.store';
import { Conversation } from '../../models/messaging.model';
import { NewConversationDialogComponent } from '../new-conversation-dialog/new-conversation-dialog.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';

@Component({
  selector: 'app-conversation-list',
  standalone: false,
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss'],
})
export class ConversationListComponent {
  constructor(
    readonly store: MessagingStore,
    private dialog: MatDialog,
  ) {}

  /** Abre el dialog "Nueva conversación" (Spec: picker de participantes). */
  openNewConversation(): void {
    this.dialog.open(NewConversationDialogComponent, {
      width: '520px',
      maxWidth: '96vw',
    });
  }

  /** Pestaña "Activas" (default; Spec N6). */
  showActive(): void {
    this.store.showArchived.set(false);
  }

  /** Pestaña "Archivadas": carga la lista la primera vez que se abre (Spec N6). */
  showArchived(): void {
    if (!this.store.showArchived()) {
      this.store.showArchived.set(true);
      this.store.loadArchived();
    }
  }

  /** Desarchiva la conversación (Spec N6): vuelve a la lista activa. */
  unarchiveConversation(conversation: Conversation, event: Event): void {
    event.stopPropagation();
    this.store.unarchiveConversation(conversation._id);
  }

  /**
   * Archiva la conversación con confirmación (Spec O6a).
   * stopPropagation para no seleccionar la conversación al pulsar el botón.
   */
  archiveConversation(conversation: Conversation, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      maxWidth: '90vw',
      data: {
        title: 'Archivar conversación',
        message: `¿Archivar la conversación con ${this.store.displayNameFor(conversation)}? Dejarás de recibir notificaciones de ella.`,
        confirmText: 'Archivar',
        cancelText: 'Cancelar',
      },
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.archiveConversation(conversation._id);
      }
    });
  }
}
