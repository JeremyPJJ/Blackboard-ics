import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { UserRole } from '../schemas/user.schema';

/**
 * Pruebas del DTO de creación de usuario (Spec F5): al quitar BLOQUEADO del
 * enum UserStatus, @IsEnum invalida 'bloqueado' automáticamente → 400.
 */
describe('CreateUserDto status validation', () => {
  function buildDto(overrides: Record<string, unknown> = {}) {
    const dto = new CreateUserDto();
    Object.assign(dto, {
      dni: '12345678',
      names: 'Ana',
      lastNames: 'Perez',
      institutionalEmail: 'ana@example.com',
      password: 'secret1',
      role: UserRole.DOCENTE,
      ...overrides,
    });
    return dto;
  }

  it('accepts valid status values (activo/inactivo)', async () => {
    for (const status of ['activo', 'inactivo']) {
      const errors = await validate(buildDto({ status }));
      expect(errors.filter((e) => e.property === 'status')).toHaveLength(0);
    }
  });

  it('rejects legacy status bloquedo (not in enum anymore)', async () => {
    const errors = await validate(buildDto({ status: 'bloqueado' }));
    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });
});