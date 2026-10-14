/**
 * Utilidades puras del dominio de reuniones (design testing strategy: unit test
 * de funciones puras, sin dependencias de Mongo/Nest).
 */

/**
 * Calcula la duración de una sesión en minutos como diferencia entre check-in y
 * check-out (Spec: "durationMinutes calculated as the difference").
 *
 * - Redondea al minuto más cercano.
 * - Mínimo 1 minuto cuando hubo tiempo transcurrido positivo (una sesión que
 *   existió nunca reporta 0 minutos en reportes de asistencia).
 * - Devuelve 0 si las fechas son inválidas o el check-out no es posterior al
 *   check-in.
 */
export function calculateDurationMinutes(
  checkInAt: Date | string,
  checkOutAt: Date | string,
): number {
  const start = new Date(checkInAt).getTime();
  const end = new Date(checkOutAt).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0;
  }

  const diffMs = end - start;
  if (diffMs <= 0) {
    return 0;
  }

  return Math.max(1, Math.round(diffMs / 60000));
}

/**
 * Filtro de historial de sesiones cerradas (Spec: Meetings O5 — historial).
 *
 * Devuelve SOLO sesiones con `checkOutAt` presente (abiertas quedan excluidas);
 * el orden descendente por `checkInAt` lo aplica el service al hacer `.sort()`.
 */
export function buildClosedSessionsFilter(courseId: string) {
  return { courseId, checkOutAt: { $ne: null } };
}

/**
 * Agrupa sesiones cerradas POR TÍTULO (Spec F2 — historial agrupado).
 *
 * - Sesiones sin título (o con título vacío/espacios) caen en el grupo
 *   determinístico "Sin título".
 * - Un mismo título siempre cae en el mismo grupo (agrupación estable).
 * - Dentro de cada grupo las sesiones se ordenan por `checkInAt` descendente
 *   (la más reciente arriba).
 * - Los grupos se ordenan alfabéticamente por título (determinístico).
 *
 * @returns Array de grupos `{ title, sessions }` con `sessions` ordenadas desc.
 */
export function groupSessionsByTitle<T extends { title?: string | null; checkInAt: Date | string }>(
  sessions: T[],
): { title: string; sessions: T[] }[] {
  const FALLBACK = 'Sin título';
  const groups = new Map<string, T[]>();

  for (const session of sessions) {
    const key = session.title?.trim() ? session.title.trim() : FALLBACK;
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