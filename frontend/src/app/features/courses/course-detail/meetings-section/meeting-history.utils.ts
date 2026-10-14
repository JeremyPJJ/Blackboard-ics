import { SessionHistoryItem } from '@features/meetings/models/meeting-session.model';

export interface SessionHistoryGroup {
  title: string;
  sessions: SessionHistoryItem[];
}

/** Grupo determinístico para sesiones sin título (Spec F2). */
export const HISTORY_FALLBACK_TITLE = 'Sin título';

/**
 * Agrupa sesiones cerradas POR TÍTULO para el historial (Spec F2).
 *
 * Espejo de `groupSessionsByTitle` del backend (jest-tested allí): sesiones sin
 * título caen en "Sin título"; orden dentro del grupo por `checkInAt` desc; los
 * grupos se ordenan alfabéticamente por título (determinístico).
 */
export function groupHistoryByTitle(sessions: SessionHistoryItem[]): SessionHistoryGroup[] {
  const groups = new Map<string, SessionHistoryItem[]>();

  for (const session of sessions) {
    const key = session.title?.trim() ? session.title.trim() : HISTORY_FALLBACK_TITLE;
    const list = groups.get(key) ?? [];
    list.push(session);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .map(([title, groupSessions]) => ({
      title,
      sessions: [...groupSessions].sort(
        (a, b) => new Date(b.checkInAt).getTime() - new Date(a.checkInAt).getTime(),
      ),
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'es'));
}