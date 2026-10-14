import {
  MESSAGE_MAX_LENGTH,
  validateConversationId,
  validateMessageContent,
  validateSendMessagePayload,
} from './messaging.utils';

describe('messaging.utils (validación de mensajes)', () => {
  describe('validateConversationId', () => {
    it('acepta un conversationId válido', () => {
      expect(validateConversationId('abc123')).toEqual({ ok: true });
    });

    it('rechaza conversationId vacío, ausente o no string', () => {
      expect(validateConversationId('').ok).toBe(false);
      expect(validateConversationId(undefined).ok).toBe(false);
      expect(validateConversationId(12345).ok).toBe(false);
      expect(validateConversationId('   ').ok).toBe(false);
    });
  });

  describe('validateMessageContent', () => {
    it('acepta contenido no vacío', () => {
      expect(validateMessageContent('hola mundo')).toEqual({ ok: true });
    });

    it('acepta contenido con espacios alrededor', () => {
      expect(validateMessageContent('  hola  ')).toEqual({ ok: true });
    });

    it('rechaza contenido vacío o solo espacios', () => {
      const result = validateMessageContent('   ');
      expect(result.ok).toBe(false);
      expect(result.code).toBe('INVALID_PAYLOAD');
    });

    it('rechaza contenido no string', () => {
      expect(validateMessageContent(null).ok).toBe(false);
      expect(validateMessageContent(42).ok).toBe(false);
      expect(validateMessageContent(undefined).ok).toBe(false);
    });

    it(`rechaza contenido mayor a ${MESSAGE_MAX_LENGTH} caracteres`, () => {
      const result = validateMessageContent('a'.repeat(MESSAGE_MAX_LENGTH + 1));
      expect(result.ok).toBe(false);
      expect(result.message).toContain(String(MESSAGE_MAX_LENGTH));
    });

    it(`acepta contenido de exactamente ${MESSAGE_MAX_LENGTH} caracteres`, () => {
      expect(validateMessageContent('a'.repeat(MESSAGE_MAX_LENGTH)).ok).toBe(true);
    });
  });

  describe('validateSendMessagePayload', () => {
    it('acepta un payload completo válido', () => {
      expect(
        validateSendMessagePayload({ conversationId: 'conv1', content: 'mensaje' }),
      ).toEqual({ ok: true });
    });

    it('rechaza payload sin conversationId', () => {
      const result = validateSendMessagePayload({ content: 'mensaje' });
      expect(result.ok).toBe(false);
      expect(result.code).toBe('INVALID_PAYLOAD');
    });

    it('rechaza payload sin contenido', () => {
      const result = validateSendMessagePayload({ conversationId: 'conv1' });
      expect(result.ok).toBe(false);
      expect(result.code).toBe('INVALID_PAYLOAD');
    });

    it('rechaza payload nulo o indefinido', () => {
      expect(validateSendMessagePayload(null).ok).toBe(false);
      expect(validateSendMessagePayload(undefined).ok).toBe(false);
    });
  });
});
