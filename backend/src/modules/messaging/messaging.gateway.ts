import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';
import { MessageType } from './schemas/message.schema';
import { validateSendMessagePayload } from './messaging.utils';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { MeetingsService } from '@modules/meetings/meetings.service';

/**
 * Gateway de mensajería real-time (socket.io).
 *
 * - Autenticación manual del handshake: `jwt.verify(token, JWT_SECRET)` (mismo secreto
 *   que el REST). Si el token es inválido o expiró se emite `error {code: 'AUTH_FAILED'}`
 *   y se cierra la conexión (Spec: expired-JWT scenario).
 * - Rooms por conversación: `conv:{id}`. Solo los participantes de una conversación
 *   son unidos a su room (Spec: membership enforcement).
 * - `sendMessage` persiste el mensaje en Mongo ANTES de emitir `newMessage`
 *   (design: persistir antes de emitir).
 * - `markAsRead` actualiza `lastReadAt` del participante y emite `conversationUpdated`
 *   a toda la room para que los contadores de no leídos se recalculen.
 * - Signaling WebRTC de la sala (Spec O2): eventos `meeting:join/leave/offer/
 *   answer/ice/chat` en la room `room:{courseId}`. `meeting:join` ejecuta
 *   `MeetingsService.assertCanEnterRoom` (vía `joinCourseRoom`, idempotente) y
 *   hace check-in; `meeting:leave` y el disconnect hacen check-out. Los eventos
 *   de oferta/respuesta/ICE se reenvían al socket destino (`targetSocketId`);
 *   `meeting:chat` se difunde a la room sin persistir (chat efímero de la sala).
 */
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
  },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  /** Estado de sala guardado por socket tras `meeting:join` (cleanup en leave/disconnect). */
  private readonly meetingRoomKey = 'meetingRoom';

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly messagingService: MessagingService,
    private readonly notificationsService: NotificationsService,
    private readonly meetingsService: MeetingsService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (!payload?.sub) {
        throw new Error('INVALID_TOKEN_PAYLOAD');
      }

      const userId = String(payload.sub);
      client.data.userId = userId;
      await client.join(`user:${userId}`);

      // Unir al socket las rooms de todas las conversaciones donde participa
      const conversations = await this.messagingService.getConversationsByUser(userId);
      await Promise.all(
        conversations.map((conversation) => client.join(`conv:${conversation._id}`)),
      );
    } catch (error) {
      client.emit('error', { code: 'AUTH_FAILED', message: 'Token inválido o expirado' });
      client.disconnect(true);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId?: string; content?: string; type?: string },
  ): Promise<void> {
    const userId = client.data.userId as string | undefined;
    if (!userId) {
      client.emit('error', { code: 'AUTH_REQUIRED', message: 'No autenticado' });
      return;
    }

    const validation = validateSendMessagePayload(payload);
    if (!validation.ok) {
      client.emit('error', { code: validation.code, message: validation.message });
      return;
    }

    const conversationId = String(payload.conversationId).trim();

    let conversation;
    try {
      conversation = await this.messagingService.getConversationById(conversationId);
    } catch (error) {
      client.emit('error', {
        code: 'CONVERSATION_NOT_FOUND',
        message: 'Conversación no encontrada',
      });
      return;
    }

    // Membership enforcement: solo participantes pueden enviar (Spec: non-participant)
    if (!conversation.participants.some((p) => String(p) === userId)) {
      client.emit('error', {
        code: 'FORBIDDEN',
        message: 'No eres participante de esta conversación',
      });
      return;
    }

    try {
      // Persistir ANTES de emitir (design: garantiza que el mensaje existe al notificar)
      const message = await this.messagingService.sendMessage(conversationId, userId, {
        content: String(payload.content).trim(),
        type: payload.type || MessageType.TEXTO,
      });

      // Una conversación puede haberse creado después de que sus participantes
      // abrieron el socket. Incorporar sus sockets activos antes de emitir evita
      // que el mensaje solo aparezca después de recargar la página.
      const archivedBy = (conversation.archivedBy || []).map(String);
      const activeParticipants = conversation.participants
        .map((participantId) => String(participantId))
        .filter((participantId) => !archivedBy.includes(participantId));
      for (const participantId of activeParticipants) {
        this.server.in(`user:${participantId}`).socketsJoin(`conv:${conversationId}`);
      }

      this.server.to(`conv:${conversationId}`).emit('newMessage', { message });

      // Mantener lista/orden de conversaciones y previews al día en todos los clientes
      this.server.to(`conv:${conversationId}`).emit('conversationUpdated', {
        conversationId,
        lastMessageAt: message.sentAt,
        lastMessageContent: message.content || '',
        lastMessageBy: message.senderId,
      });

      // Notificación in-page (Spec O6b): persistir una UserNotification por
      // destinatario y emitir `notification:new` a la room. Quienes archivaron
      // la conversación ya NO están en la room (handleConnection filtra
      // archivedBy y archiveConversation WS hace leave) → no reciben nada.
      const recipients = conversation.participants
        .map((p) => String(p))
        .filter((p) => p !== userId && !archivedBy.includes(p));

      const preview = (message.content || '').slice(0, 120);
      for (const recipientId of recipients) {
        await this.notificationsService.create({
          userId: recipientId,
          type: 'message',
          title: 'Nuevo mensaje',
          message: preview,
          courseId: conversation.courseId ? String(conversation.courseId) : undefined,
        });
      }
      this.server.to(`conv:${conversationId}`).emit('notification:new', {
        type: 'message',
        conversationId,
        senderId: String(message.senderId),
        preview,
        sentAt: message.sentAt,
      });
    } catch (error) {
      client.emit('error', {
        code: 'INTERNAL',
        message: 'No se pudo guardar el mensaje',
      });
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId?: string },
  ): Promise<void> {
    const userId = client.data.userId as string | undefined;
    if (!userId) {
      client.emit('error', { code: 'AUTH_REQUIRED', message: 'No autenticado' });
      return;
    }

    if (typeof payload?.conversationId !== 'string' || !payload.conversationId.trim()) {
      client.emit('error', {
        code: 'INVALID_PAYLOAD',
        message: 'conversationId es obligatorio',
      });
      return;
    }

    const conversationId = payload.conversationId.trim();

    let conversation;
    try {
      conversation = await this.messagingService.getConversationById(conversationId);
    } catch (error) {
      client.emit('error', {
        code: 'CONVERSATION_NOT_FOUND',
        message: 'Conversación no encontrada',
      });
      return;
    }

    if (!conversation.participants.some((p) => String(p) === userId)) {
      client.emit('error', {
        code: 'FORBIDDEN',
        message: 'No eres participante de esta conversación',
      });
      return;
    }

    try {
      const updated = await this.messagingService.markAsRead(conversationId, userId);
      const lastReadAt = updated.lastReadAt?.get(userId) ?? null;

      // Design contract: conversationUpdated {conversationId, lastReadAt}
      // Se emite a toda la room para que los participantes actualicen contadores no leídos.
      this.server.to(`conv:${conversationId}`).emit('conversationUpdated', {
        conversationId,
        lastReadAt,
        userId,
      });
    } catch (error) {
      client.emit('error', {
        code: 'INTERNAL',
        message: 'No se pudo actualizar la conversación',
      });
    }
  }

  @SubscribeMessage('archiveConversation')
  async handleArchiveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId?: string },
  ): Promise<void> {
    const userId = client.data.userId as string | undefined;
    if (!userId || typeof payload?.conversationId !== 'string' || !payload.conversationId.trim()) {
      client.emit('error', { code: 'INVALID_PAYLOAD', message: 'conversationId es obligatorio' });
      return;
    }
    // La persistencia del archivo la hace REST (PATCH /archive); aquí solo se
    // saca al socket de la room para que no reciba más newMessage /
    // notification:new de una conversación archivada (Spec O6a esc.3).
    client.leave(`conv:${payload.conversationId.trim()}`);
  }

  /**
   * `unarchiveConversation` — vuelve a unir el socket a la room `conv:{id}`
   * tras desarchivar (Spec N6 esc. "Re-join socket"). La persistencia del
   * `$pull` la hace REST (PATCH /unarchive); aquí solo se restaura la
   * suscripción para que newMessage / notification:new vuelvan a llegar en
   * vivo. Los mensajes recibidos mientras estuvo archivada quedaron
   * persistidos y aparecen como NO-leídos al recargar la lista (lastReadAt
   * anterior al período de archivo).
   */
  @SubscribeMessage('unarchiveConversation')
  async handleUnarchiveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId?: string },
  ): Promise<void> {
    const userId = client.data.userId as string | undefined;
    if (!userId || typeof payload?.conversationId !== 'string' || !payload.conversationId.trim()) {
      client.emit('error', { code: 'INVALID_PAYLOAD', message: 'conversationId es obligatorio' });
      return;
    }

    const conversationId = payload.conversationId.trim();

    let conversation;
    try {
      conversation = await this.messagingService.getConversationById(conversationId);
    } catch (error) {
      client.emit('error', {
        code: 'CONVERSATION_NOT_FOUND',
        message: 'Conversación no encontrada',
      });
      return;
    }

    if (!conversation.participants.some((p) => String(p) === userId)) {
      client.emit('error', {
        code: 'FORBIDDEN',
        message: 'No eres participante de esta conversación',
      });
      return;
    }

    await client.join(`conv:${conversationId}`);
  }

  // ─── Signaling WebRTC de la sala (Spec O2) ─────────────────────────────────

  /**
   * `meeting:join` — el cliente entra a la sala `room:{courseId}`.
   *
   * - Control de acceso: `joinCourseRoom` ejecuta `assertCanEnterRoom` (403 a
   *   no-miembros) y hace check-in idempotente (reutiliza la sesión abierta;
   *   el índice parcial único evita duplicados en reconexiones).
   * - Al entrar, el socket recibe el roster actual (`meeting:participants`,
   *   sin incluirse a sí mismo) y el resto de la sala recibe
   *   `meeting:participant-joined`. El que entra inicia las ofertas del mesh.
   */
  @SubscribeMessage('meeting:join')
  async handleMeetingJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { courseId?: string },
  ): Promise<void> {
    const userId = client.data.userId as string | undefined;
    if (!userId) {
      client.emit('meeting:error', { code: 'AUTH_REQUIRED', message: 'No autenticado' });
      return;
    }

    const courseId = typeof payload?.courseId === 'string' ? payload.courseId.trim() : '';
    if (!courseId) {
      client.emit('meeting:error', { code: 'INVALID_PAYLOAD', message: 'courseId es obligatorio' });
      return;
    }

    let session;
    try {
      session = await this.meetingsService.joinCourseRoom(courseId, userId);
    } catch (error) {
      // Spec O2 esc.4: no-miembro → evento de error; no entra a la sala ni a la sesión.
      const forbidden = error instanceof ForbiddenException;
      client.emit('meeting:error', {
        code: forbidden ? 'FORBIDDEN' : 'NOT_FOUND',
        message: error instanceof Error ? error.message : 'No se pudo ingresar a la sala',
      });
      return;
    }

    const room = `room:${courseId}`;
    client.data[this.meetingRoomKey] = {
      courseId,
      sessionId: String(session._id),
    };
    await client.join(room);

    // Roster actual: los demás sockets ya en la sala (excluye al que entra).
    const sockets = await this.server.in(room).fetchSockets();
    const participants = sockets
      .filter((s) => s.id !== client.id)
      .map((s) => ({ userId: String(s.data?.userId ?? ''), socketId: s.id }))
      .filter((p) => p.userId);

    client.emit('meeting:participants', { participants });

    // Avisa a los demás para que preparen su lado del peer (el que entra oferta).
    client.broadcast.to(room).emit('meeting:participant-joined', {
      userId,
      socketId: client.id,
    });
  }

  /**
   * `meeting:leave` — el cliente sale de la sala de forma explícita.
   * Check-out idempotente + aviso a los peers restantes (Spec O2 esc.3).
   */
  @SubscribeMessage('meeting:leave')
  async handleMeetingLeave(@ConnectedSocket() client: Socket): Promise<void> {
    const room = client.data[this.meetingRoomKey] as
      | { courseId: string; sessionId: string }
      | undefined;
    if (!room) {
      return; // nunca hizo join o ya salió
    }
    const userId = client.data.userId as string;
    client.data[this.meetingRoomKey] = undefined;
    await client.leave(`room:${room.courseId}`);

    try {
      await this.meetingsService.leaveCourseRoom(room.sessionId, userId);
    } catch {
      // Idempotente: si el check-out ya se hizo (doble leave/disconnect) se ignora.
    }

    client.broadcast.to(`room:${room.courseId}`).emit('meeting:participant-left', {
      userId,
      socketId: client.id,
    });
  }

  /**
   * Desconexión inesperada (cerrar pestaña, perder red): si el socket estaba en
   * una sala, cierra la sesión (check-out) y avisa a los peers (Spec O2 esc.3:
   * "sale o cierra pestaña").
   */
  async handleDisconnect(client: Socket): Promise<void> {
    const room = client.data[this.meetingRoomKey] as
      | { courseId: string; sessionId: string }
      | undefined;
    if (!room) {
      return;
    }
    const userId = client.data.userId as string | undefined;
    client.data[this.meetingRoomKey] = undefined;

    try {
      if (userId) {
        await this.meetingsService.leaveCourseRoom(room.sessionId, userId);
      }
    } catch {
      // Idempotente: el check-out pudo completarse ya (REST keepalive o leave).
    }

    client.broadcast.to(`room:${room.courseId}`).emit('meeting:participant-left', {
      userId: userId ?? '',
      socketId: client.id,
    });
  }

  /**
   * Reenvío de oferta/answer/ICE al socket destino (`targetSocketId`). El emisor
   * debe estar autenticado y dentro de una sala (validación común en
   * `canRelayMeetingSignal`).
   */
  @SubscribeMessage('meeting:offer')
  handleMeetingOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { targetSocketId?: string; offer?: unknown },
  ): void {
    if (!this.canRelayMeetingSignal(client, payload?.targetSocketId)) {
      return;
    }
    this.server.to(payload.targetSocketId).emit('meeting:offer', {
      fromUserId: client.data.userId,
      fromSocketId: client.id,
      offer: payload.offer,
    });
  }

  @SubscribeMessage('meeting:answer')
  handleMeetingAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { targetSocketId?: string; answer?: unknown },
  ): void {
    if (!this.canRelayMeetingSignal(client, payload?.targetSocketId)) {
      return;
    }
    this.server.to(payload.targetSocketId).emit('meeting:answer', {
      fromUserId: client.data.userId,
      fromSocketId: client.id,
      answer: payload.answer,
    });
  }

  @SubscribeMessage('meeting:ice')
  handleMeetingIce(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { targetSocketId?: string; candidate?: unknown },
  ): void {
    if (!this.canRelayMeetingSignal(client, payload?.targetSocketId)) {
      return;
    }
    this.server.to(payload.targetSocketId).emit('meeting:ice', {
      fromUserId: client.data.userId,
      fromSocketId: client.id,
      candidate: payload.candidate,
    });
  }

  /**
   * `meeting:chat` — chat efímero de la sala (Spec O2: "chat en sala llega a
   * ambos"). Se difunde a la room sin persistir (sin schema; rollback limpio).
   */
  @SubscribeMessage('meeting:chat')
  handleMeetingChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { content?: string },
  ): void {
    const room = client.data[this.meetingRoomKey] as
      | { courseId: string; sessionId: string }
      | undefined;
    const userId = client.data.userId as string | undefined;
    if (!userId || !room) {
      client.emit('meeting:error', { code: 'INVALID_STATE', message: 'No estás en una sala' });
      return;
    }

    const content = typeof payload?.content === 'string' ? payload.content.trim() : '';
    if (!content) {
      return;
    }

    client.broadcast.to(`room:${room.courseId}`).emit('meeting:chat', {
      userId,
      content: content.slice(0, 1000),
      sentAt: new Date().toISOString(),
    });
  }

  /** Validación común de relay: autenticado, dentro de una sala y target válido. */
  private canRelayMeetingSignal(client: Socket, targetSocketId: unknown): targetSocketId is string {
    if (!client.data.userId) {
      client.emit('meeting:error', { code: 'AUTH_REQUIRED', message: 'No autenticado' });
      return false;
    }
    if (!client.data[this.meetingRoomKey]) {
      client.emit('meeting:error', { code: 'INVALID_STATE', message: 'No estás en una sala' });
      return false;
    }
    if (typeof targetSocketId !== 'string' || !targetSocketId) {
      client.emit('meeting:error', { code: 'INVALID_PAYLOAD', message: 'targetSocketId es obligatorio' });
      return false;
    }
    return true;
  }

  private extractToken(client: Socket): string {
    const auth = client.handshake.auth as { token?: string } | undefined;
    if (auth?.token) {
      return auth.token;
    }

    const query = client.handshake.query as { token?: string } | undefined;
    if (query?.token) {
      return query.token;
    }

    const authorization = client.handshake.headers.authorization;
    if (authorization?.startsWith('Bearer ')) {
      return authorization.slice(7);
    }

    return '';
  }
}
