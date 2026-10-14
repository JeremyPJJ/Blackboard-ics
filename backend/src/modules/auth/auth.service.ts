import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '@modules/users/users.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RefreshToken, RefreshTokenDocument } from './entities/refresh-token.entity';
import { validateNewPassword } from './password.utils';

/** Ventana del rate-limit de cambio de contraseña (15 minutos en ms). */
export const CHANGE_PASSWORD_WINDOW_MS = 15 * 60 * 1000;
/** Máximo de intentos por usuario dentro de la ventana (Spec: 5/15min por usuario). */
export const CHANGE_PASSWORD_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  /**
   * Rate-limit en memoria por userId para el cambio de contraseña
   * (Spec security: 5 intentos / 15 minutos / usuario).
   *
   * El diseño permite `@nestjs/throttler` O un mapa en memoria; el repo NO tiene
   * @nestjs/throttler instalado, así que se implementa un limiter simple keyed by
   * userId. NOTA: al ser en memoria, se pierde al reiniciar el proceso y no escala
   * a múltiples instancias — suficiente para esta plataforma monoproceso; un
   * limiter distribuido (Redis) quedaría como mejora futura.
   */
  private readonly changePasswordAttempts = new Map<string, { count: number; windowStart: number }>();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    // Verificar estado del usuario: solo 'activo' puede iniciar sesión.
    // Rechaza 'inactivo' y cualquier valor legacy/desconocido (p.ej. 'bloqueado' no migrado).
    if (user.status !== 'activo') {
      throw new ForbiddenException('Su cuenta está inactiva. Contacte al administrador del sistema.');
    }

    if (await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.institutionalEmail, sub: user._id, role: user.role };
    
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION') || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRATION') || '7d',
      secret: this.configService.get('REFRESH_TOKEN_SECRET'),
    });

    // Guardar refresh token en la base de datos
    const refreshTokenDoc = new this.refreshTokenModel({
      token: refreshToken,
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    });
    await refreshTokenDoc.save();

    return {
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        institutionalEmail: user.institutionalEmail,
        names: user.names,
        lastNames: user.lastNames,
        role: user.role,
        status: user.status,
        tags: user.tags,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      });

      // Verificar que el refresh token existe y no está revocado
      const tokenDoc = await this.refreshTokenModel.findOne({
        token: refreshToken,
        isRevoked: false,
      });

      if (!tokenDoc) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      // Generar nuevo access token
      const newPayload = { email: payload.email, sub: payload.sub, role: payload.role };
      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: this.configService.get('JWT_EXPIRATION') || '15m',
      });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  async logout(userId: string, refreshToken: string) {
    await this.refreshTokenModel.updateOne(
      { token: refreshToken, userId },
      { isRevoked: true },
    );
    return { message: 'Logout exitoso' };
  }

  /**
   * Cambio de contraseña self-service (Spec: Change Password domain).
   *
   * - `bcrypt.compare(currentPassword, hash)` → si es incorrecta, 401 y NO cambia.
   * - Valida reglas de `newPassword` (min 8, letra+número, distinta a la actual) → 400.
   * - Actualiza el hash y REVOCA todos los refresh tokens del usuario
   *   (fuerza re-login en todos los dispositivos — decisión del diseño).
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    this.assertChangePasswordAllowed(userId);

    const user = await this.usersService.findById(userId);

    // 401: contraseña actual incorrecta (Spec: wrong current → 401, no change)
    const currentOk = await bcrypt.compare(currentPassword, user.password);
    if (!currentOk) {
      this.recordChangePasswordAttempt(userId);
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // 400: reglas de validación (Spec: weak / equals current → 400)
    const validation = validateNewPassword(newPassword, currentPassword);
    if (!validation.valid) {
      this.recordChangePasswordAttempt(userId);
      throw new BadRequestException(validation.message);
    }

    // Actualizar hash (UsersService.changePassword ya hashea con bcrypt)
    await this.usersService.changePassword(userId, newPassword);

    // Revocar TODOS los refresh tokens del usuario (mismo mecanismo que logout:
    // marcar isRevoked=true; aquí para todos los dispositivos).
    await this.refreshTokenModel.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true },
    );

    this.resetChangePasswordAttempts(userId);

    return { message: 'Contraseña actualizada correctamente' };
  }

  /** Aplica el rate-limit (Spec: 5 intentos / 15 min / usuario). */
  private assertChangePasswordAllowed(userId: string): void {
    const now = Date.now();
    const entry = this.changePasswordAttempts.get(userId);

    if (entry && now - entry.windowStart < CHANGE_PASSWORD_WINDOW_MS) {
      if (entry.count >= CHANGE_PASSWORD_MAX_ATTEMPTS) {
        throw new HttpException(
          'Demasiados intentos de cambio de contraseña. Intente nuevamente en 15 minutos.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      return;
    }

    // Ventana nueva o vencida: (re)iniciar el contador en el primer intento
    if (!entry || now - entry.windowStart >= CHANGE_PASSWORD_WINDOW_MS) {
      this.changePasswordAttempts.set(userId, { count: 0, windowStart: now });
    }
  }

  /** Registra un intento fallido (401/400) para el rate-limit. */
  private recordChangePasswordAttempt(userId: string): void {
    const entry = this.changePasswordAttempts.get(userId);
    if (entry) {
      entry.count += 1;
    }
  }

  /** Limpia el contador del usuario tras un cambio exitoso. */
  private resetChangePasswordAttempts(userId: string): void {
    this.changePasswordAttempts.delete(userId);
  }
}
