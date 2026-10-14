import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    try {
      const user = await this.authService.validateUser(email, password);
      if (!user) {
        throw new UnauthorizedException('Correo o contraseña incorrectos');
      }
      return user;
    } catch (error) {
      // Re-lanzar errores de ForbiddenException (usuario no activo)
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }
  }
}
