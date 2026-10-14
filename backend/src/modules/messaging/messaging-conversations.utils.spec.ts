import {
  buildConversationsListFilter,
  isArchivedByUser,
} from './messaging-conversations.utils';

/**
 * Pruebas de los helpers puros del listado de conversaciones (Spec N6).
 * Se testean con objetos planos, sin base de datos (patrón del repo).
 */
describe('buildConversationsListFilter (Spec N6)', () => {
  it('sin includeArchived excluye las archivadas por el usuario (ronda 3 intacto)', () => {
    expect(buildConversationsListFilter('user-1', false)).toEqual({
      participants: 'user-1',
      isActive: true,
      archivedBy: { $ne: 'user-1' },
    });
  });

  it('con includeArchived=true no filtra archivedBy', () => {
    expect(buildConversationsListFilter('user-1', true)).toEqual({
      participants: 'user-1',
      isActive: true,
    });
  });
});

describe('isArchivedByUser (Spec N6)', () => {
  it('true cuando el uid está en archivedBy', () => {
    expect(isArchivedByUser(['user-1', 'user-2'], 'user-1')).toBe(true);
  });

  it('false cuando el uid no está o archivedBy es undefined', () => {
    expect(isArchivedByUser(['user-2'], 'user-1')).toBe(false);
    expect(isArchivedByUser(undefined, 'user-1')).toBe(false);
    expect(isArchivedByUser([], 'user-1')).toBe(false);
  });
});