import { ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';

/**
 * Tests del PermissionsGuard aplicados al namespace `ofertas.*` de las
 * ofertas laborales (Spec: Job Offers — "Student cannot create a job").
 *
 * Convención del repo (slice 3, importar.participantes): super_admin pasa
 * siempre; usuario con lista explícita de permisos es exigido; usuario sin
 * permisos explícitos pasa (la validación por rol existe aparte).
 */
describe('PermissionsGuard (ofertas.*)', () => {
  function createGuard(permission: string | undefined): PermissionsGuard {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(permission),
    } as any;
    return new PermissionsGuard(reflector);
  }

  function createContext(user: any): any {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
  }

  it('permite a super_admin aunque ofertas.crear no esté en su lista', () => {
    const guard = createGuard('ofertas.crear');
    const ctx = createContext({ role: 'super_admin', permissions: ['cursos.ver'] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite crear oferta (POST /jobs) al usuario con ofertas.crear en su lista explícita', () => {
    const guard = createGuard('ofertas.crear');
    const ctx = createContext({
      role: 'unidad_academica',
      permissions: ['ofertas.ver', 'ofertas.crear', 'ofertas.editar'],
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('lanza 403 para estudiante SIN ofertas.crear en su lista explícita (Spec: student cannot create a job)', () => {
    const guard = createGuard('ofertas.crear');
    const ctx = createContext({
      role: 'estudiante',
      permissions: ['ofertas.ver', 'ofertas.postular'],
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('permite a usuarios sin permisos explícitos (estudiante típico) ver y postular', () => {
    const guard = createGuard('ofertas.ver');
    const ctx = createContext({ role: 'estudiante', permissions: [] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite cuando el endpoint no declara @Permission', () => {
    const guard = createGuard(undefined);
    const ctx = createContext({ role: 'estudiante', permissions: [] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('deniega cuando no hay usuario en el request', () => {
    const guard = createGuard('ofertas.ver');
    const ctx = createContext(undefined);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('lanza 403 para revisar postulaciones sin ofertas.revisar', () => {
    const guard = createGuard('ofertas.revisar');
    const ctx = createContext({
      role: 'secretaria',
      permissions: ['ofertas.ver', 'ofertas.crear'],
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
