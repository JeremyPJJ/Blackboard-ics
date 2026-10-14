import { BadRequestException } from '@nestjs/common';
import {
  buildRowResults,
  summarizeResults,
  validateParticipantRow,
  findHeaderRowIndex,
  EMPTY_FILE_MESSAGE,
  MISSING_COLUMNS_MESSAGE,
  ImportRowResult,
} from './import.utils';

describe('import.utils — validación de filas (pura)', () => {
  describe('findHeaderRowIndex', () => {
    it('encuentra el encabezado sin importar mayúsculas ni orden de columnas', () => {
      const rows: unknown[][] = [
        ['LASTNAMES', 'institutionalEmail', 'dni', 'NAMES'],
        ['Gómez', 'gomez@test.edu', '12345678', 'Ana'],
      ];
      expect(findHeaderRowIndex(rows)).toBe(0);
    });

    it('devuelve -1 cuando no existe el encabezado completo', () => {
      const rows: unknown[][] = [
        ['dni', 'names'],
        ['12345678', 'Ana'],
      ];
      expect(findHeaderRowIndex(rows)).toBe(-1);
    });

    it('tolera filas de título antes del encabezado', () => {
      const rows: unknown[][] = [
        ['Lista de participantes'],
        ['dni', 'names', 'lastNames', 'institutionalEmail'],
        ['12345678', 'Ana', 'Gómez', 'ana@test.edu'],
      ];
      expect(findHeaderRowIndex(rows)).toBe(1);
    });
  });

  describe('buildRowResults', () => {
    const header: unknown[] = ['dni', 'names', 'lastNames', 'institutionalEmail'];

    it('lanza 400 con el mensaje exacto del Spec para archivo vacío', () => {
      expect(() => buildRowResults([])).toThrowError(BadRequestException);
      expect(() => buildRowResults([])).toThrowError(EMPTY_FILE_MESSAGE);
      expect(() => buildRowResults([['', '', '', '']])).toThrowError(
        EMPTY_FILE_MESSAGE,
      );
    });

    it('lanza 400 cuando el archivo solo tiene el encabezado (sin filas de datos)', () => {
      expect(() => buildRowResults([header])).toThrowError(EMPTY_FILE_MESSAGE);
    });

    it('lanza 400 cuando faltan columnas requeridas', () => {
      const rows: unknown[][] = [
        ['dni', 'names'],
        ['12345678', 'Ana'],
      ];
      expect(() => buildRowResults(rows)).toThrowError(MISSING_COLUMNS_MESSAGE);
    });

    it('marca como válida una fila completa y recorta espacios', () => {
      const rows: unknown[][] = [
        header,
        [' 12345678 ', ' Ana ', ' Gómez ', ' ana@test.edu '],
      ];
      const results = buildRowResults(rows);
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('valid');
      expect(results[0].data).toEqual({
        dni: '12345678',
        names: 'Ana',
        lastNames: 'Gómez',
        institutionalEmail: 'ana@test.edu',
      });
      expect(results[0].rowNumber).toBe(2);
    });

    it('reporta error por DNI vacío con su mensaje', () => {
      const rows: unknown[][] = [header, ['', 'Ana', 'Gómez', 'ana@test.edu']];
      const results = buildRowResults(rows);
      expect(results[0].status).toBe('error');
      expect(results[0].message).toBe('El DNI es obligatorio');
    });

    it('reporta error por correo inválido', () => {
      const rows: unknown[][] = [
        header,
        ['12345678', 'Ana', 'Gómez', 'correo-sin-arroba'],
      ];
      const results = buildRowResults(rows);
      expect(results[0].status).toBe('error');
      expect(results[0].message).toBe('El correo institucional no es válido');
    });

    it('marca como duplicado el segundo DNI repetido dentro del archivo', () => {
      const rows: unknown[][] = [
        header,
        ['11111111', 'Ana', 'Gómez', 'ana@test.edu'],
        ['22222222', 'Luis', 'Pérez', 'luis@test.edu'],
        ['11111111', 'Ana', 'Gómez', 'ana2@test.edu'],
      ];
      const results = buildRowResults(rows);
      expect(results.map((r) => r.status)).toEqual(['valid', 'valid', 'duplicate']);
      expect(results[2].message).toBe('El DNI ya aparece en una fila anterior del archivo');
    });

    it('ignora filas completamente vacías entre datos', () => {
      const rows: unknown[][] = [
        header,
        ['11111111', 'Ana', 'Gómez', 'ana@test.edu'],
        ['', '', '', ''],
        ['22222222', 'Luis', 'Pérez', 'luis@test.edu'],
      ];
      const results = buildRowResults(rows);
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.rowNumber)).toEqual([2, 4]);
    });

    it('reporta el número de fila física correcto (incluye encabezado)', () => {
      const rows: unknown[][] = [
        ['Título'],
        header,
        ['11111111', 'Ana', 'Gómez', 'ana@test.edu'],
      ];
      const results = buildRowResults(rows);
      expect(results[0].rowNumber).toBe(3);
    });
  });

  describe('validateParticipantRow', () => {
    it('valida una fila correcta', () => {
      const result = validateParticipantRow(
        { dni: '123', names: 'Ana', lastNames: 'Gómez', institutionalEmail: 'a@b.edu' },
        2,
      );
      expect(result.status).toBe('valid');
    });

    it('rechaza apellidos vacíos', () => {
      const result = validateParticipantRow(
        { dni: '123', names: 'Ana', lastNames: '', institutionalEmail: 'a@b.edu' },
        2,
      );
      expect(result.status).toBe('error');
      expect(result.message).toBe('Los apellidos son obligatorios');
    });
  });

  describe('summarizeResults', () => {
    const results: ImportRowResult[] = [
      { rowNumber: 2, status: 'valid', message: 'ok' },
      { rowNumber: 3, status: 'valid', message: 'ok' },
      { rowNumber: 4, status: 'duplicate', message: 'dup' },
      { rowNumber: 5, status: 'error', message: 'err' },
    ];

    it('cuenta total, válidas, duplicadas y erróneas', () => {
      const summary = summarizeResults(results);
      expect(summary).toMatchObject({
        total: 4,
        valid: 2,
        duplicate: 1,
        error: 1,
      });
    });

    it('recorta la vista previa a 10 filas', () => {
      const many = Array.from({ length: 15 }, (_, i) => ({
        rowNumber: i + 2,
        status: 'valid' as const,
        message: 'ok',
      }));
      const summary = summarizeResults(many);
      expect(summary.preview).toHaveLength(10);
      expect(summary.total).toBe(15);
    });
  });
});