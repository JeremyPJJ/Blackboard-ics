import { canEnterRoom } from './meeting-access.utils';

/**
 * Pruebas del helper puro de acceso a la sala (Spec N4).
 * Se testea con objetos planos, sin base de datos (patrón del repo:
 * unit test de funciones puras, sin dependencias de Mongo/Nest).
 */
describe('canEnterRoom (acceso a sala — Spec N4)', () => {
  const nonMember = { isTeacher: false, isStudent: false };

  it('super_admin entra a cualquier sala aunque no sea miembro', () => {
    expect(canEnterRoom({ role: 'super_admin', permissions: [], ...nonMember })).toBe(true);
  });

  it('permiso reuniones.* permite entrar a cualquier sala', () => {
    expect(
      canEnterRoom({ role: 'docente', permissions: ['reuniones.manage'], ...nonMember }),
    ).toBe(true);
    expect(
      canEnterRoom({ role: 'estudiante', permissions: ['reuniones.ver'], ...nonMember }),
    ).toBe(true);
  });

  it('docente del curso entra sin permisos explícitos', () => {
    expect(
      canEnterRoom({ role: 'docente', permissions: [], isTeacher: true, isStudent: false }),
    ).toBe(true);
  });

  it('estudiante inscrito entra sin permisos explícitos', () => {
    expect(
      canEnterRoom({ role: 'estudiante', permissions: [], isTeacher: false, isStudent: true }),
    ).toBe(true);
  });

  it('no-miembro sin permisos reuniones.* NO entra (403 preservado)', () => {
    expect(canEnterRoom({ role: 'estudiante', permissions: [], ...nonMember })).toBe(false);
    expect(canEnterRoom({ role: undefined, permissions: undefined, ...nonMember })).toBe(false);
  });

  it('permiso de otro namespace NO habilita el acceso', () => {
    expect(
      canEnterRoom({ role: 'estudiante', permissions: ['cursos.ver', 'ofertas.postular'], ...nonMember }),
    ).toBe(false);
  });
});