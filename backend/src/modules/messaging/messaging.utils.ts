/**
 * Helpers puros de validación del dominio de mensajería.
 * Separados del gateway para poder unit-testear la lógica sin socket.io.
 */

export interface MessageValidationResult {
  ok: boolean;
  code?: string;
  message?: string;
}

export const MESSAGE_MAX_LENGTH = 2000;

export function validateConversationId(conversationId: unknown): MessageValidationResult {
  if (typeof conversationId !== 'string' || conversationId.trim().length === 0) {
    return {
      ok: false,
      code: 'INVALID_PAYLOAD',
      message: 'conversationId es obligatorio',
    };
  }
  return { ok: true };
}

export function validateMessageContent(content: unknown): MessageValidationResult {
  if (typeof content !== 'string' || content.trim().length === 0) {
    return {
      ok: false,
      code: 'INVALID_PAYLOAD',
      message: 'El contenido del mensaje no puede estar vacío',
    };
  }
  if (content.trim().length > MESSAGE_MAX_LENGTH) {
    return {
      ok: false,
      code: 'INVALID_PAYLOAD',
      message: `El mensaje no puede superar los ${MESSAGE_MAX_LENGTH} caracteres`,
    };
  }
  return { ok: true };
}

export function validateSendMessagePayload(payload: {
  conversationId?: unknown;
  content?: unknown;
}): MessageValidationResult {
  const conversationCheck = validateConversationId(payload?.conversationId);
  if (!conversationCheck.ok) {
    return conversationCheck;
  }
  return validateMessageContent(payload?.content);
}
