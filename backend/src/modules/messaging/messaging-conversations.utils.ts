/**
 * Helpers puros del listado/desarchivo de conversaciones (Spec N6 — vista de
 * archivadas). Separados del service para unit-testear la lógica sin Mongo.
 */

/**
 * Filtro de listado de conversaciones de un usuario.
 *
 * - `includeArchived = false` (default): excluye las conversaciones donde el
 *   usuario figura en `archivedBy` (comportamiento previo, ronda 3 intacto).
 * - `includeArchived = true`: las incluye (vista "Archivadas").
 */
export function buildConversationsListFilter(uid: string, includeArchived: boolean) {
  const filter: any = {
    participants: String(uid),
    isActive: true,
  };
  if (!includeArchived) {
    filter.archivedBy = { $ne: String(uid) };
  }
  return filter;
}

/**
 * Indica si `uid` figura en `archivedBy` de una conversación (Spec N6 esc.
 * "Unarchive no aplicable": desarchivar algo que el usuario no archivó es
 * un 404 o no-op, sin romper la lista).
 */
export function isArchivedByUser(archivedBy: string[] | undefined, uid: string): boolean {
  return (archivedBy ?? []).some((id) => String(id) === String(uid));
}