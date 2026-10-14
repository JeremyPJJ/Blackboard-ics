/**
 * Utilidades de notas para la vista "Mis Notas" (Spec: Student Grades).
 *
 * El promedio usa la regla publicadas-preferente:
 *  - Si hay al menos un score publicado, se promedia SOLO sobre las publicadas.
 *  - Si no hay ninguna publicada pero hay borradores calificados, se promedian
 *    TODAS las que tienen score.
 *  - Los scores null/undefined se ignoran siempre.
 *  - Si no hay ningún score, devuelve '—' (nunca undefined/NaN).
 *
 * Misma semántica que el promedio del antiguo my-grades-dialog (publicadas
 * primero, fallback todas), extraída a un helper puro reutilizable.
 */

export interface GradeSource {
  score: number | null | undefined;
  isPublished?: boolean;
}

export function calculateAverage(items: GradeSource[]): number | '—' {
  const hasScore = (i: GradeSource): boolean =>
    i.score !== null && i.score !== undefined;
  const published = items.filter(i => hasScore(i) && !!i.isPublished);
  const all = items.filter(hasScore);
  const source = published.length > 0 ? published : all;
  if (source.length === 0) return '—';
  return source.reduce((acc, i) => acc + (i.score as number), 0) / source.length;
}