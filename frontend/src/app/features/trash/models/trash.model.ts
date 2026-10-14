/**
 * Modelos de la papelera (Spec: Trash / Papelera).
 * `TrashType` refleja 1:1 el enum del backend (trash.schema.ts).
 */
export enum TrashType {
  USER = 'user',
  COURSE = 'course',
  TASK = 'task',
  EXAM = 'exam',
  FORUM = 'forum',
  MATERIAL = 'material',
}

export interface TrashEntry {
  _id: string;
  type: TrashType;
  originalCollection: string;
  /** Snapshot del documento original (contiene `_id`, nombre, etc.). */
  document: any;
  deletedBy: string;
  deletedAt: Date;
  restoreUntil: Date;
  reason?: string;
  restoredAt?: Date;
  restoredBy?: string;
  isRestored?: boolean;
  permanentlyDeletedAt?: Date;
  /** Error al intentar restaurar (el documento original ya no existe). */
  restoreError?: string;
}

export const TRASH_TYPE_LABELS: Record<TrashType, string> = {
  [TrashType.USER]: 'Usuario',
  [TrashType.COURSE]: 'Curso',
  [TrashType.TASK]: 'Tarea',
  [TrashType.EXAM]: 'Examen',
  [TrashType.FORUM]: 'Foro',
  [TrashType.MATERIAL]: 'Material',
};

/** Devuelve el nombre visible de la entrada (usuario: names+lastNames; curso: name). */
export function trashEntryName(entry: TrashEntry): string {
  const doc = entry.document ?? {};
  if (entry.type === TrashType.USER) {
    const names = doc.names ?? '';
    const lastNames = doc.lastNames ?? '';
    return `${names} ${lastNames}`.trim() || 'Usuario';
  }
  if (entry.type === TrashType.COURSE) {
    return doc.name ?? 'Curso';
  }
  return doc.name ?? doc.title ?? doc._id ?? 'Elemento';
}