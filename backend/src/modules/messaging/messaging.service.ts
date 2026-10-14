import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation, ConversationDocument, ConversationType } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { User, UserDocument } from '@modules/users/schemas/user.schema';
import { Course, CourseDocument } from '@modules/courses/schemas/course.schema';
import { assertConversationScope } from './messaging-scope.utils';
import {
  buildConversationsListFilter,
  isArchivedByUser,
} from './messaging-conversations.utils';

@Injectable()
export class MessagingService {
  constructor(
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
  ) {}

  async createConversation(
    type: ConversationType,
    participants: string[],
    courseId?: string,
    name?: string,
    creatorId?: string,
  ): Promise<ConversationDocument> {
    // Validación de alcance (Spec: Messaging — super_admin → cualquiera;
    // docente/estudiante → solo participantes de SUS cursos)
    const creator = await this.userModel.findById(creatorId).select('role').exec();
    if (!creator) {
      throw new NotFoundException('Usuario no encontrado');
    }

    let course: CourseDocument | null = null;
    if (courseId) {
      course = await this.courseModel.findById(courseId).exec();
      if (!course) {
        throw new NotFoundException('Curso no encontrado');
      }
    }

    assertConversationScope(creator, course, participants);

    const conversation = new this.conversationModel({
      type,
      participants,
      courseId,
      name,
      isActive: true,
    });
    return conversation.save();
  }

  /**
   * Lista las conversaciones del usuario enriqueciendo cada una con:
   * - `unreadCount`: mensajes con `sentAt` posterior a su `lastReadAt` (Spec: unread count).
   * - `participantNames`: nombre legible de cada participante para la UI.
   *
   * `includeArchived` (Spec N6): con `true` se incluyen las conversaciones
   * donde el usuario figura en `archivedBy` (vista "Archivadas"); sin el
   * parámetro el comportamiento previo se mantiene intacto (excluidas).
   */
  async getConversationsByUser(userId: string, includeArchived = false): Promise<any[]> {
    const uid = String(userId);
    const conversations = await this.conversationModel
      .find(buildConversationsListFilter(uid, includeArchived))
      .exec();

    const participantIds = Array.from(
      new Set(conversations.flatMap((conversation) => conversation.participants.map(String))),
    );
    const users = participantIds.length
      ? await this.userModel.find({ _id: { $in: participantIds } }).select('names lastNames').exec()
      : [];
    const participantNames: Record<string, string> = {};
    for (const user of users) {
      participantNames[String(user._id)] = `${user.lastNames}, ${user.names}`.trim();
    }

    return Promise.all(
      conversations.map(async (conversation) => {
        const lastRead = conversation.lastReadAt?.get(uid);
        const filter: any = {
          conversationId: conversation._id,
          // Los mensajes enviados por el propio usuario nunca son "no leídos".
          senderId: { $ne: uid },
          deletedAt: { $exists: false },
        };
        if (lastRead) {
          filter.sentAt = { $gt: lastRead };
        }
        const unreadCount = await this.messageModel.countDocuments(filter).exec();
        return {
          ...conversation.toObject(),
          unreadCount,
          participantNames,
        };
      }),
    );
  }

  async getConversationById(id: string): Promise<ConversationDocument> {
    const conversation = await this.conversationModel.findById(id).exec();
    if (!conversation) {
      throw new NotFoundException('Conversación no encontrada');
    }
    return conversation;
  }

  /**
   * Archiva una conversación para `userId` (Spec O6a).
   * - `$addToSet` → idempotente: archivar de nuevo no duplica el uid.
   * - Solo participantes pueden archivar (403 en caso contrario).
   * - No toca `isActive` ni los mensajes: B conserva la conversación intacta.
   */
  async archiveConversation(conversationId: string, userId: string): Promise<ConversationDocument> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation.participants.some((p) => String(p) === String(userId))) {
      throw new ForbiddenException('No eres participante de esta conversación');
    }
    return this.conversationModel
      .findByIdAndUpdate(
        conversationId,
        { $addToSet: { archivedBy: String(userId) } },
        { new: true },
      )
      .exec();
  }

  /**
   * Desarchiva una conversación para `userId` (Spec N6).
   * - `$pull` del uid de `archivedBy` → vuelve a aparecer en la lista activa
   *   (y el gateway re-une el socket a `conv:{id}` para reanudar lo en vivo).
   * - Solo participantes pueden desarchivar (403 en caso contrario).
   * - Si el usuario no la archivó → no-op (Spec: 404 o no-op, sin romper la
   *   lista); se devuelve la conversación tal cual.
   */
  async unarchiveConversation(conversationId: string, userId: string): Promise<ConversationDocument> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation.participants.some((p) => String(p) === String(userId))) {
      throw new ForbiddenException('No eres participante de esta conversación');
    }
    if (!isArchivedByUser(conversation.archivedBy, String(userId))) {
      return conversation;
    }
    return this.conversationModel
      .findByIdAndUpdate(
        conversationId,
        { $pull: { archivedBy: String(userId) } },
        { new: true },
      )
      .exec();
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    messageData: any,
  ): Promise<MessageDocument> {
    const conversation = await this.getConversationById(conversationId);
    
    const message = new this.messageModel({
      ...messageData,
      senderId,
      conversationId,
      sentAt: new Date(),
    });

    await message.save();

    // Actualizar última mensagem de la conversación
    conversation.lastMessageBy = senderId as any;
    conversation.lastMessageAt = new Date();
    conversation.lastMessageContent = messageData.content || '';
    await conversation.save();

    return message;
  }

  async getMessages(conversationId: string, limit = 50): Promise<MessageDocument[]> {
    return this.messageModel
      .find({ conversationId, deletedAt: { $exists: false } })
      .sort({ sentAt: -1 })
      .limit(limit)
      .exec();
  }

  async markAsRead(conversationId: string, userId: string): Promise<ConversationDocument> {
    const conversation = await this.getConversationById(conversationId);
    conversation.lastReadAt.set(String(userId), new Date());
    return conversation.save();
  }

  async deleteMessage(messageId: string): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) {
      throw new NotFoundException('Mensaje no encontrado');
    }
    message.deletedAt = new Date();
    return message.save();
  }
}
