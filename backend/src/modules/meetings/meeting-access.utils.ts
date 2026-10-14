/**
 * Regla de acceso a la sala de reuniones (Spec N4 — acceso ampliado).
 *
 * Pueden entrar a CUALQUIER sala:
 * - `super_admin` (role === 'super_admin')
 * - usuarios con un permiso de namespace `reuniones.*` en `user.permissions`
 *   (p. ej. `reuniones.manage`, `reuniones.ver` — mismo criterio que el
 *   PermissionsGuard: se lee el array `permissions`).
 *
 * En cualquier otro caso el acceso queda restringido a docentes del curso o
 * estudiantes inscritos (comportamiento previo; el no-miembro sin esos
 * permisos sigue recibiendo 403 — Spec N4 esc. "Sin acceso").
 */
export function canEnterRoom(input: {
  role?: string;
  permissions?: string[];
  isTeacher: boolean;
  isStudent: boolean;
}): boolean {
  if (input.role === 'super_admin') {
    return true;
  }
  if (input.permissions?.some((permission) => permission.startsWith('reuniones.'))) {
    return true;
  }
  return input.isTeacher || input.isStudent;
}