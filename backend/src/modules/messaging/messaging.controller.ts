import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MessagingService } from './messaging.service';
import { ConversationType } from './schemas/conversation.schema';

@Controller('messaging')
@UseGuards(AuthGuard('jwt'))
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('conversations')
  createConversation(
    @Body('type') type: ConversationType,
    @Body('participants') participants: string[],
    @Body('courseId') courseId: string,
    @Body('name') name: string,
    @Request() req,
  ) {
    return this.messagingService.createConversation(
      type,
      participants,
      courseId,
      name,
      req.user._id,
    );
  }

  /**
   * Lista de conversaciones del usuario (Spec N6).
   * `?includeArchived=true` incluye las archivadas por el usuario; sin el
   * parámetro el comportamiento previo se mantiene (solo activas).
   */
  @Get('conversations')
  getConversations(@Request() req, @Query('includeArchived') includeArchived?: string) {
    const withArchived = includeArchived === 'true' || includeArchived === '1';
    return this.messagingService.getConversationsByUser(req.user._id, withArchived);
  }

  @Get('conversations/:id')
  getConversation(@Param('id') id: string) {
    return this.messagingService.getConversationById(id);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Param('id') id: string,
    @Body() messageData: any,
    @Request() req,
  ) {
    return this.messagingService.sendMessage(id, req.user._id, messageData);
  }

  @Get('conversations/:id/messages')
  getMessages(@Param('id') id: string) {
    return this.messagingService.getMessages(id);
  }

  @Post('conversations/:id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.messagingService.markAsRead(id, req.user._id);
  }

  @Patch('conversations/:id/archive')
  archiveConversation(@Param('id') id: string, @Request() req) {
    return this.messagingService.archiveConversation(id, req.user._id);
  }

  /** Desarchiva la conversación para el usuario autenticado (Spec N6). */
  @Patch('conversations/:id/unarchive')
  unarchiveConversation(@Param('id') id: string, @Request() req) {
    return this.messagingService.unarchiveConversation(id, req.user._id);
  }

  @Delete('messages/:messageId')
  deleteMessage(@Param('messageId') messageId: string) {
    return this.messagingService.deleteMessage(messageId);
  }
}
