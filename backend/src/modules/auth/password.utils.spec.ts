import {
  validateNewPassword,
  PASSWORD_MIN_LENGTH,
} from './password.utils';

describe('validateNewPassword (Password validation rules — Spec)', () => {
  it('acepta una contraseña válida (≥8, letra y número, distinta a la actual)', () => {
    const result = validateNewPassword('nuevaPass1', 'actualPass9');
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('rechaza cuando es más corta que 8 caracteres', () => {
    const result = validateNewPassword('Ab1', 'actualPass9');
    expect(result.valid).toBe(false);
    expect(result.message).toContain(`${PASSWORD_MIN_LENGTH} caracteres`);
  });

  it('rechaza una contraseña vacía', () => {
    const result = validateNewPassword('', 'actualPass9');
    expect(result.valid).toBe(false);
    expect(result.message).toContain(`${PASSWORD_MIN_LENGTH} caracteres`);
  });

  it('rechaza si no tiene número', () => {
    const result = validateNewPassword('sololetras', 'actualPass9');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('letra y un número');
  });

  it('rechaza si no tiene letra', () => {
    const result = validateNewPassword('12345678', 'actualPass9');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('letra y un número');
  });

  it('rechaza si es igual a la contraseña actual', () => {
    const result = validateNewPassword('mismaPass9', 'mismaPass9');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('igual a la actual');
  });

  it('no compara con la actual si no se pasa (validación de complejidad independiente)', () => {
    const result = validateNewPassword('nuevaPass1');
    expect(result.valid).toBe(true);
  });

  it('acepta letras en mayúscula como letra válida', () => {
    const result = validateNewPassword('CONTRASENA2024', 'actualPass9');
    expect(result.valid).toBe(true);
  });
});
