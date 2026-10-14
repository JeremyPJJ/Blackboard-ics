import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/permission.decorator';

/**
 * Verifica que el usuario tenga el permiso requerido (decorador @Permission).
 * - super_admin: acceso total.
 * - Si el usuario tiene permisos explícitos asignados, se exigen esos.
 * - Sin permisos explícitos: se permite (la validación por rol ya existe).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!permission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    if (user.role === 'super_admin') return true;

    if (user.permissions && user.permissions.length > 0) {
      if (user.permissions.includes(permission)) return true;
      throw new ForbiddenException('No tienes permiso para realizar esta acción');
    }

    return true;
  }
}