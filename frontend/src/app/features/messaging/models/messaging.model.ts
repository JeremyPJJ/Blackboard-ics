export type ConversationType = 'individual' | 'grupal';

export interface Conversation {
  _id: string;
  type: ConversationType;
  participants: string[];
  courseId?: string;
  name?: string;
  lastMessageBy?: string;
  lastMessageAt?: string;
  lastMessageContent?: string;
  lastReadAt?: Record<string, string>;
  isActive?: boolean;
  /** userIds que archivaron la conversación (Spec O6a — oculta solo para ellos). */
  archivedBy?: string[];
  unreadCount?: number;
  participantNames?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export type MessageType = 'texto' | 'imagen' | 'archivo' | 'audio';

export interface Message {
  _id: string;
  senderId: string;
  conversationId: string;
  type: MessageType;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  sentAt: string;
  readAt?: string;
  deletedAt?: string;
}

export interface SocketErrorPayload {
  code: string;
  message: string;
}
