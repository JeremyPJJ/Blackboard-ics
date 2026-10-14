/**
 * Validación pura de contraseña nueva para el cambio de contraseña self-service
 * (Spec: Password validation rules — min 8, al menos una letra y un número,
 * distinta a la actual).
 *
 * Separada del servicio para poder testearla como función pura sin Mock de Mongoose.
 */

export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordValidationResult {
  valid: boolean;
  /** Mensaje de error legible (solo cuando `valid` es false). */
  message?: string;
}

/**
 * Valida una contraseña nueva contra las reglas del Spec.
 *
 * @param newPassword contraseña nueva a validar
 * @param currentPassword contraseña actual (para la regla "distinta a la actual")
 * @returns `{ valid: true }` si pasa, o `{ valid: false, message }` con el motivo.
 */
export function validateNewPassword(
  newPassword: string,
  currentPassword?: string,
): PasswordValidationResult {
  if (!newPassword || newPassword.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      message: `La nueva contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
    };
  }

  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  if (!hasLetter || !hasNumber) {
    return {
      valid: false,
      message: 'La nueva contraseña debe contener al menos una letra y un número',
    };
  }

  if (currentPassword !== undefined && newPassword === currentPassword) {
    return {
      valid: false,
      message: 'La nueva contraseña no puede ser igual a la actual',
    };
  }

  return { valid: true };
}
