import { MessagingService } from './messaging.service';

describe('MessagingService', () => {
  describe('getConversationsByUser', () => {
    it('excluye los mensajes enviados por el usuario del contador no leído', async () => {
      const conversation = {
        _id: 'conversation-1',
        participants: ['sender-1', 'recipient-1'],
        lastReadAt: new Map<string, Date>(),
        toObject: () => ({
          _id: 'conversation-1',
          participants: ['sender-1', 'recipient-1'],
        }),
      };
      const conversationModel = {
        find: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([conversation]),
        }),
      };
      const messageModel = {
        countDocuments: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(0),
        }),
      };
      const userModel = {
        find: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      };
      const service = new MessagingService(
        conversationModel as any,
        messageModel as any,
        userModel as any,
        {} as any,
      );

      await service.getConversationsByUser('sender-1');

      expect(messageModel.countDocuments).toHaveBeenCalledWith({
        conversationId: 'conversation-1',
        senderId: { $ne: 'sender-1' },
        deletedAt: { $exists: false },
      });
    });
  });
});
