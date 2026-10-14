import { Component } from '@angular/core';
import { MessagingStore } from '../../store/messaging.store';

@Component({
  selector: 'app-message-input',
  standalone: false,
  templateUrl: './message-input.component.html',
  styleUrls: ['./message-input.component.scss'],
})
export class MessageInputComponent {
  message = '';

  constructor(readonly store: MessagingStore) {}

  send(): void {
    const content = this.message;
    if (!content?.trim()) {
      return;
    }
    this.store.sendMessage(content);
    this.message = '';
  }
}
