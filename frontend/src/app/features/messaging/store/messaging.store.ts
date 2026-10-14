import { Injectable, computed, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { Conversation, Message, SocketErrorPayload } from '../models/messaging.model';
import { MessagingRestService } from '../services/messaging-rest.service';
import { MessagingSocketService } from '../services/messaging-socket.service';

/**
 * Estado de mensajería con Angular Signals (Spec: Signals-based state).
 * Señales: conversations, selectedConversationId, messages, unreadCounts;
 * derivados con computed (selectedConversation, sortedConversations, totalUnread).
 */
@Injectable({
  providedIn: 'root',
})
export class MessagingStore {
  readonly conversations = signal<Conversation[]>([]);
  readonly selectedConversationId = signal<string | null>(null);
  readonly messages = signal<Message[]>([]);
  readonly unreadCounts = signal<Record<string, number>>({});
  readonly loadingConversations = signal(false);
  readonly loadingMessages = signal(false);
  readonly connected = signal(false);

  // Spec N6 — vista de archivadas
  readonly archivedConversations = signal<Conversation[]>([]);
  readonly archivedUnreadCounts = signal<Record<string, number>>({});
  readonly loadingArchived = signal(false);
  readonly showArchived = signal(false);

  readonly selectedConversation = computed<Conversation | null>(() => {
    const id = this.selectedConversationId();
    if (!id) {
      return null;
    }
    return this.conversations().find((c) => c._id === id) ?? null;
  });

  readonly sortedConversations = computed<Conversation[]>(() =>
    [...this.conversations()].sort(
      (a, b) =>
        new Date(b.lastMessageAt ?? b.createdAt ?? 0).getTime() -
        new Date(a.lastMessageAt ?? a.createdAt ?? 0).getTime(),
    ),
  );

  readonly totalUnread = computed<number>(() =>
    Object.values(this.unreadCounts()).reduce((sum, count) => sum + count, 0),
  );

  constructor(
    private rest: MessagingRestService,
    private socket: MessagingSocketService,
    private notificationService: NotificationService,
    private authService: AuthService,
  ) {
    this.socket.newMessage.subscribe(({ message }) => void this.onNewMessage(message));
    this.socket.conversationUpdated.subscribe((payload) => this.onConversationUpdated(payload));
    this.socket.error.subscribe((payload) => this.onSocketError(payload));
    this.socket.connected.subscribe((connected) => this.connected.set(connected));
  }

  connect(): void {
    this.socket.connect();
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  async loadConversations(): Promise<void> {
    this.loadingConversations.set(true);
    try {
      const conversations = await lastValueFrom(this.rest.getConversations());
      this.conversations.set(conversations);
      const counts: Record<string, number> = {};
      for (const conversation of conversations) {
        counts[conversation._id] = conversation.unreadCount ?? 0;
      }
      this.unreadCounts.set(counts);
    } catch (error) {
      this.notificationService.error('No se pudieron cargar las conversaciones');
    } finally {
      this.loadingConversations.set(false);
    }
  }

  /**
   * Crea una conversación vía REST (Spec: "Nueva conversación" + picker).
   * El backend valida el alcance; ante 403 se muestra un mensaje claro y se
   * re-lanza el error para que el caller no cierre el dialog.
   */
  async createConversation(
    participants: string[],
    courseId?: string,
    name?: string,
  ): Promise<Conversation> {
    // El backend NO agrega al creador a `participants`; sin él la conversación
    // no aparecería en su lista (getConversationsByUser filtra por participante).
    const myId = this.currentUserId();
    const participantIds =
      myId && !participants.includes(myId) ? [...participants, myId] : participants;
    const type = participantIds.length > 2 ? 'grupal' : 'individual';

    try {
      const conversation = await lastValueFrom(
        this.rest.createConversation(type, participantIds, courseId, name),
      );
      // Refrescar la lista enriquecida (unreadCount/participantNames) y
      // seleccionar la conversación recién creada.
      await this.loadConversations();
      await this.selectConversation(conversation._id);
      return conversation;
    } catch (error: any) {
      if (error?.status === 403) {
        this.notificationService.error(
          'No tienes permiso para iniciar conversación con ese usuario',
        );
      } else {
        this.notificationService.error(
          error?.error?.message || 'No se pudo crear la conversación',
        );
      }
      throw error;
    }
  }

  /**
   * Abre la conversación individual con `targetId` sin duplicar (Spec R4).
   * Busca en conversations() una individual existente con el target (el
   * backend NO deduplica por par) y la selecciona; si no existe, crea.
   * Ante 403 createConversation ya notifica y re-lanza → el caller NO navega.
   */
  async findOrCreateConversation(targetId: string, courseId?: string): Promise<Conversation | null> {
    // Desde course-detail / user-list la lista puede no estar cargada aún.
    if (this.conversations().length === 0) {
      await this.loadConversations();
    }
    const myId = this.currentUserId();
    const existing = this.conversations().find(
      (c) =>
        c.type === 'individual' &&
        c.participants.includes(targetId) &&
        (!myId || c.participants.includes(myId)),
    );
    if (existing) {
      await this.selectConversation(existing._id);
      return existing;
    }
    return this.createConversation([targetId], courseId);
  }

  /**
   * Archiva la conversación para el usuario actual (Spec O6a).
   * - REST persiste ($addToSet) y el WS saca el socket de la room → dejan de
   *   llegar newMessage/notification:new de esa conversación.
   * - Se elimina de la lista local y de los contadores no leídos.
   */
  async archiveConversation(conversationId: string): Promise<void> {
    try {
      await lastValueFrom(this.rest.archiveConversation(conversationId));
      this.socket.archiveConversation(conversationId);
      this.conversations.update((list) => list.filter((c) => c._id !== conversationId));
      this.unreadCounts.update((counts) => {
        const next = { ...counts };
        delete next[conversationId];
        return next;
      });
      if (this.selectedConversationId() === conversationId) {
        this.selectedConversationId.set(null);
        this.messages.set([]);
      }
      this.notificationService.success('Conversación archivada');
    } catch (error: any) {
      this.notificationService.error(
        error?.error?.message || 'No se pudo archivar la conversación',
      );
    }
  }

  /**
   * Carga las conversaciones archivadas por el usuario (Spec N6).
   * El backend enriquece igual que las activas (unreadCount/participantNames),
   * así los no-leídos acumulados durante el archivo se ven en la pestaña y al
   * desarchivar la conversación reaparece con sus counts correctos.
   */
  async loadArchived(): Promise<void> {
    this.loadingArchived.set(true);
    try {
      const conversations = await lastValueFrom(this.rest.getConversations(true));
      this.archivedConversations.set(conversations);
      const counts: Record<string, number> = {};
      for (const conversation of conversations) {
        counts[conversation._id] = conversation.unreadCount ?? 0;
      }
      this.archivedUnreadCounts.set(counts);
    } catch (error) {
      this.notificationService.error('No se pudieron cargar las conversaciones archivadas');
    } finally {
      this.loadingArchived.set(false);
    }
  }

  /**
   * Desarchiva la conversación (Spec N6): REST persiste el $pull, el WS vuelve
   * a unir el socket a la room (reanuda mensajes en vivo) y se recarga la
   * lista activa para que la conversación reaparezca con sus no-leídos
   * acumulados (loadConversations es la fuente autoritativa de counts).
   */
  async unarchiveConversation(conversationId: string): Promise<void> {
    try {
      await lastValueFrom(this.rest.unarchiveConversation(conversationId));
      this.socket.unarchiveConversation(conversationId);
      this.archivedConversations.update((list) => list.filter((c) => c._id !== conversationId));
      this.archivedUnreadCounts.update((counts) => {
        const next = { ...counts };
        delete next[conversationId];
        return next;
      });
      await this.loadConversations();
      this.notificationService.success('Conversación restaurada');
    } catch (error: any) {
      this.notificationService.error(
        error?.error?.message || 'No se pudo restaurar la conversación',
      );
    }
  }

  async selectConversation(conversationId: string): Promise<void> {
    this.selectedConversationId.set(conversationId);
    // Marcar como leído: por WS (broadcast en tiempo real) y por REST (garantía de persistencia)
    this.unreadCounts.update((counts) => ({ ...counts, [conversationId]: 0 }));
    this.socket.markAsRead(conversationId);
    this.rest.markAsRead(conversationId).subscribe();

    this.loadingMessages.set(true);
    try {
      const messages = await lastValueFrom(this.rest.getMessages(conversationId));
      // El REST devuelve orden descendente; la UI muestra cronológico
      this.messages.set(messages.reverse());
    } catch (error) {
      this.messages.set([]);
      this.notificationService.error('No se pudieron cargar los mensajes');
    } finally {
      this.loadingMessages.set(false);
    }
  }

  sendMessage(content: string): void {
    const conversationId = this.selectedConversationId();
    const trimmed = content?.trim();
    if (!conversationId || !trimmed) {
      return;
    }
    if (!this.socket.isConnected()) {
      this.notificationService.warning('Sin conexión con el servidor de mensajería');
      return;
    }
    this.socket.sendMessage(conversationId, trimmed);
  }

  currentUserId(): string | null {
    return this.authService.getCurrentUser()?._id ?? null;
  }

  /** Nombre legible de una conversación para la lista de conversaciones. */
  displayNameFor(conversation: Conversation): string {
    if (conversation.name) {
      return conversation.name;
    }
    const myId = this.currentUserId();
    const otherId = conversation.participants.find((p) => p !== myId);
    if (otherId && conversation.participantNames?.[otherId]) {
      return conversation.participantNames[otherId];
    }
    return 'Conversación';
  }

  /** Preview de la última actividad para la lista de conversaciones. */
  lastMessagePreview(conversation: Conversation): string {
    const senderId = conversation.lastMessageBy;
    if (!senderId) {
      return 'Sin mensajes aún';
    }
    const myId = this.currentUserId();
    const senderName =
      senderId === myId
        ? 'Tú'
        : conversation.participantNames?.[senderId] ?? 'Usuario';
    return `${senderName}: ${conversation.lastMessageContent ?? ''}`;
  }

  /** Formato de hora/día para timestamps de mensajes y lista. */
  formatTime(iso: string | undefined): string {
    if (!iso) {
      return '';
    }
    const date = new Date(iso);
    const isToday = date.toDateString() === new Date().toDateString();
    if (isToday) {
      return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  }

  private async onNewMessage(message: Message): Promise<void> {
    const myId = this.currentUserId();
    const senderId = String(message.senderId);
    const isOwnMessage = senderId === myId;
    const selectedId = this.selectedConversationId();

    // La conversación puede haberse creado después de abrir el socket. En ese
    // caso se incorpora desde REST, que ya trae preview y no-leídos correctos.
    if (!this.conversations().some((c) => c._id === message.conversationId)) {
      await this.loadConversations();
      return;
    }

    // Actualizar preview/orden de la lista
    this.conversations.update((list) =>
      list.map((conversation) =>
        conversation._id === message.conversationId
          ? {
              ...conversation,
              lastMessageAt: message.sentAt,
              lastMessageContent: message.content ?? '',
              lastMessageBy: senderId,
            }
          : conversation,
      ),
    );

    if (message.conversationId === selectedId) {
      this.messages.update((current) =>
        current.some((m) => m._id === message._id) ? current : [...current, message],
      );
      if (!isOwnMessage) {
        // Estoy viendo la conversación: se marca como leída al instante
        this.unreadCounts.update((counts) => ({ ...counts, [message.conversationId]: 0 }));
        this.socket.markAsRead(message.conversationId);
      }
    } else if (!isOwnMessage) {
      this.unreadCounts.update((counts) => ({
        ...counts,
        [message.conversationId]: (counts[message.conversationId] ?? 0) + 1,
      }));
    }
  }

  private onConversationUpdated(payload: {
    conversationId: string;
    lastReadAt?: string | null;
    lastMessageAt?: string;
    lastMessageContent?: string;
    lastMessageBy?: string;
    userId?: string;
  }): void {
    const myId = this.authService.getCurrentUser()?._id;

    this.conversations.update((list) =>
      list.map((conversation) => {
        if (conversation._id !== payload.conversationId) {
          return conversation;
        }
        const next: Conversation = { ...conversation };
        if (payload.lastMessageAt) {
          next.lastMessageAt = payload.lastMessageAt;
          next.lastMessageContent = payload.lastMessageContent ?? conversation.lastMessageContent;
          next.lastMessageBy = payload.lastMessageBy ?? conversation.lastMessageBy;
        }
        if (payload.userId && payload.lastReadAt) {
          next.lastReadAt = {
            ...(conversation.lastReadAt ?? {}),
            [payload.userId]: payload.lastReadAt,
          };
        }
        return next;
      }),
    );

    if (payload.userId && payload.userId === myId) {
      this.unreadCounts.update((counts) => ({ ...counts, [payload.conversationId]: 0 }));
    }
  }

  private onSocketError(payload: SocketErrorPayload): void {
    if (payload?.code === 'FORBIDDEN') {
      this.notificationService.error(payload.message ?? 'No autorizado');
      return;
    }
    this.notificationService.error(payload?.message ?? 'Error de mensajería');
  }
}
