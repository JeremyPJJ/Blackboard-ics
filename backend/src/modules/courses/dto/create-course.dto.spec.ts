import { validate } from 'class-validator';
import { CreateCourseDto, COURSE_CAREERS } from './create-course.dto';

/**
 * Pruebas del DTO de creación de curso (Spec R6-1): `career` debe ser uno de
 * los 5 valores del vocabulario fijo; valores legacy (Matemática/Economía)
 * quedan fuera de la lista blanca y son rechazados → 400.
 */
describe('CreateCourseDto career validation', () => {
  function buildDto(overrides: Record<string, unknown> = {}) {
    const dto = new CreateCourseDto();
    Object.assign(dto, {
      name: 'Curso de prueba',
      code: 'TEST-101',
      career: 'Enfermería',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      ...overrides,
    });
    return dto;
  }

  it('accepts the 5 fixed career values', async () => {
    for (const career of COURSE_CAREERS) {
      const errors = await validate(buildDto({ career }));
      expect(errors.filter((e) => e.property === 'career')).toHaveLength(0);
    }
  });

  it('rejects legacy careers not in the whitelist (Matemática/Economía)', async () => {
    for (const career of ['Matemática', 'Economía']) {
      const errors = await validate(buildDto({ career }));
      expect(errors.some((e) => e.property === 'career')).toBe(true);
    }
  });

  it('rejects an empty career', async () => {
    const errors = await validate(buildDto({ career: '' }));
    expect(errors.some((e) => e.property === 'career')).toBe(true);
  });
});