import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Cuerpo de `POST /auth/change-password` (Spec: Change password DTO —
 * `{ currentPassword, newPassword }`).
 */
export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
