import { Component, OnInit } from '@angular/core';
import { MessagingStore } from './store/messaging.store';

@Component({
  selector: 'app-messaging',
  standalone: false,
  templateUrl: './messaging.component.html',
  styleUrls: ['./messaging.component.scss'],
})
export class MessagingComponent implements OnInit {
  constructor(readonly store: MessagingStore) {}

  async ngOnInit(): Promise<void> {
    // La conexión WS es global (se abre en app.component al iniciar sesión):
    // la campana y el snackbar de `notification:new` (Spec O6b) deben seguir
    // activos fuera de /messaging, así que NO se desconecta al salir.
    this.store.connect();
    await this.store.loadConversations();

    if (window.matchMedia('(max-width: 768px)').matches) {
      this.store.selectedConversationId.set(null);
      this.store.messages.set([]);
      return;
    }

    if (!this.store.selectedConversationId()) {
      const first = this.store.sortedConversations()[0];
      if (first) {
        void this.store.selectConversation(first._id);
      }
    }
  }
}
