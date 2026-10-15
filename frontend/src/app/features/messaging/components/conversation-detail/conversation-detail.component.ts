import { AfterViewChecked, Component, ElementRef, ViewChild } from '@angular/core';
import { MessagingStore } from '../../store/messaging.store';

@Component({
  selector: 'app-conversation-detail',
  standalone: false,
  templateUrl: './conversation-detail.component.html',
  styleUrls: ['./conversation-detail.component.scss'],
})
export class ConversationDetailComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLElement>;

  private lastConversationId: string | null = null;
  private lastMessageCount = -1;

  constructor(readonly store: MessagingStore) {}

  ngAfterViewChecked(): void {
    const conversationId = this.store.selectedConversationId();
    const messageCount = this.store.messages().length;
    if (conversationId !== this.lastConversationId || messageCount !== this.lastMessageCount) {
      this.lastConversationId = conversationId;
      this.lastMessageCount = messageCount;
      this.scrollToBottom();
    }
  }

  isMine(senderId: string): boolean {
    return senderId === this.store.currentUserId();
  }

  senderName(senderId: string): string {
    return this.store.selectedConversation()?.participantNames?.[senderId] ?? 'Usuario';
  }

  closeConversation(): void {
    this.store.selectedConversationId.set(null);
    this.store.messages.set([]);
  }

  private scrollToBottom(): void {
    if (this.messagesContainer?.nativeElement) {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    }
  }
}
