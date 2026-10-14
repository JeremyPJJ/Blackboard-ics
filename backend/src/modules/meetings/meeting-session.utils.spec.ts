import { calculateDurationMinutes, buildClosedSessionsFilter, groupSessionsByTitle } from './meeting-session.utils';

describe('calculateDurationMinutes', () => {
  const at = (iso: string) => new Date(iso);

  it('calcula 30 minutos exactos', () => {
    expect(
      calculateDurationMinutes(at('2026-08-27T10:00:00Z'), at('2026-08-27T10:30:00Z')),
    ).toBe(30);
  });

  it('redondea 90 segundos al minuto más cercano (2)', () => {
    expect(
      calculateDurationMinutes(at('2026-08-27T10:00:00Z'), at('2026-08-27T10:01:30Z')),
    ).toBe(2);
  });

  it('redondea 29 segundos a 1 minuto (piso mínimo)', () => {
    expect(
      calculateDurationMinutes(at('2026-08-27T10:00:00Z'), at('2026-08-27T10:00:29Z')),
    ).toBe(1);
  });

  it('devuelve 0 cuando el check-out es anterior al check-in', () => {
    expect(
      calculateDurationMinutes(at('2026-08-27T10:30:00Z'), at('2026-08-27T10:00:00Z')),
    ).toBe(0);
  });

  it('devuelve 0 cuando check-in y check-out son iguales', () => {
    expect(
      calculateDurationMinutes(at('2026-08-27T10:00:00Z'), at('2026-08-27T10:00:00Z')),
    ).toBe(0);
  });

  it('devuelve 0 con fechas inválidas', () => {
    expect(calculateDurationMinutes('no-es-fecha', at('2026-08-27T10:30:00Z'))).toBe(0);
    expect(calculateDurationMinutes(at('2026-08-27T10:00:00Z'), 'no-es-fecha')).toBe(0);
    expect(calculateDurationMinutes('a', 'b')).toBe(0);
  });

  it('acepta strings ISO como entrada', () => {
    expect(
      calculateDurationMinutes('2026-08-27T10:00:00Z', '2026-08-27T11:05:00Z'),
    ).toBe(65);
  });
});

describe('buildClosedSessionsFilter', () => {
  it('filtra por courseId y solo sesiones con checkOutAt presente', () => {
    expect(buildClosedSessionsFilter('curso-1')).toEqual({
      courseId: 'curso-1',
      checkOutAt: { $ne: null },
    });
  });
});

describe('groupSessionsByTitle', () => {
  const session = (id: string, title: string | null, checkInAt: string) => ({
    _id: id,
    title,
    checkInAt,
  });

  it('agrupa por título (3 "Clase 5" + 1 "Repaso" → 2 grupos)', () => {
    const groups = groupSessionsByTitle([
      session('a', 'Clase 5', '2026-08-28T10:00:00Z'),
      session('b', 'Clase 5', '2026-08-27T10:00:00Z'),
      session('c', 'Clase 5', '2026-08-26T10:00:00Z'),
      session('d', 'Repaso', '2026-08-25T10:00:00Z'),
    ]);
    expect(groups).toHaveLength(2);
    const clase = groups.find((g) => g.title === 'Clase 5')!;
    const repaso = groups.find((g) => g.title === 'Repaso')!;
    expect(clase.sessions).toHaveLength(3);
    expect(repaso.sessions).toHaveLength(1);
  });

  it('sesiones sin título caen en grupo "Sin título" (estable)', () => {
    const groups = groupSessionsByTitle([
      session('a', null, '2026-08-28T10:00:00Z'),
      session('b', '   ', '2026-08-27T10:00:00Z'),
      session('c', 'Clase 5', '2026-08-26T10:00:00Z'),
    ]);
    const sinTitulo = groups.find((g) => g.title === 'Sin título')!;
    expect(sinTitulo.sessions.map((s) => s._id)).toEqual(['a', 'b']);
  });

  it('ordena sesiones dentro del grupo por fecha desc (más reciente arriba)', () => {
    const groups = groupSessionsByTitle([
      session('vieja', 'Clase 5', '2026-08-26T10:00:00Z'),
      session('nueva', 'Clase 5', '2026-08-28T10:00:00Z'),
      session('media', 'Clase 5', '2026-08-27T10:00:00Z'),
    ]);
    const grupo = groups[0];
    expect(grupo.sessions.map((s) => s._id)).toEqual(['nueva', 'media', 'vieja']);
  });

  it('ordena los grupos alfabéticamente por título (determinístico)', () => {
    const groups = groupSessionsByTitle([
      session('r', 'Repaso', '2026-08-25T10:00:00Z'),
      session('c', 'Clase 5', '2026-08-28T10:00:00Z'),
      session('s', 'Sin título', '2026-08-24T10:00:00Z'),
    ]);
    expect(groups.map((g) => g.title)).toEqual(['Clase 5', 'Repaso', 'Sin título']);
  });

  it('devuelve array vacío sin sesiones', () => {
    expect(groupSessionsByTitle([])).toEqual([]);
  });
});