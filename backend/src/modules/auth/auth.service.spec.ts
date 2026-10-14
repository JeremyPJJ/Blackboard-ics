import { ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

/**
 * Pruebas del guard de estado en validateUser (Spec F5: fusión bloqueado→inactivo).
 *
 * - Solo status 'activo' puede autenticar.
 * - 'inactivo' → ForbiddenException (mensaje preservado).
 * - Legacy 'bloqueado' no migrado → ForbiddenException (riesgo del proposal cerrado).
 */
describe('AuthService.validateUser', () => {
  function setupService(user: any) {
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue(user),
    };
    const service = new AuthService(
      usersService as any,
      {} as any,
      {} as any,
      {} as any,
    );
    return service;
  }

  function buildUser(status: string, passwordHash = 'hash') {
    const plain = {
      _id: 'user-1',
      institutionalEmail: 'a@b.c',
      password: passwordHash,
      status,
      toObject: () => ({ _id: 'user-1', institutionalEmail: 'a@b.c', password: passwordHash, status }),
    };
    return plain;
  }

  it('returns null when user not found', async () => {
    const service = setupService(null);
    await expect(service.validateUser('x@y.z', 'pw')).resolves.toBeNull();
  });

  it('rejects status inactivo with ForbiddenException (preserved message)', async () => {
    const service = setupService(buildUser('inactivo'));
    await expect(service.validateUser('a@b.c', 'pw')).rejects.toThrow(
      new ForbiddenException('Su cuenta está inactiva. Contacte al administrador del sistema.'),
    );
  });

  it('rejects legacy status bloqueado (no migrado) with ForbiddenException', async () => {
    const service = setupService(buildUser('bloqueado'));
    await expect(service.validateUser('a@b.c', 'pw')).rejects.toThrow(ForbiddenException);
  });

  it('returns null on wrong password for activo user', async () => {
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
    const service = setupService(buildUser('activo'));
    await expect(service.validateUser('a@b.c', 'pw')).resolves.toBeNull();
  });

  it('returns user without password when activo and password matches', async () => {
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    const service = setupService(buildUser('activo'));
    const result = await service.validateUser('a@b.c', 'pw');
    expect(result).toBeDefined();
    expect(result.password).toBeUndefined();
    expect(result.status).toBe('activo');
  });
});