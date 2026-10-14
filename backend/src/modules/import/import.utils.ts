import { BadRequestException } from '@nestjs/common';

/**
 * Lógica PURA de validación de filas para la importación masiva de
 * participantes. Todo lo que no depende de Mongo ni de `xlsx` vive acá para
 * poder testearse con Jest (Spec: "per-row result with rowNumber, status and
 * message"; diseño: "Funciones puras: validación de filas").
 */

export const REQUIRED_IMPORT_COLUMNS = [
  'dni',
  'names',
  'lastNames',
  'institutionalEmail',
] as const;

export type RequiredImportColumn = (typeof REQUIRED_IMPORT_COLUMNS)[number];

export const EMPTY_FILE_MESSAGE = 'El archivo no contiene filas de datos';
export const MISSING_COLUMNS_MESSAGE =
  'El archivo no contiene las columnas requeridas: dni, names, lastNames, institutionalEmail';

export interface ImportRowData {
  dni: string;
  names: string;
  lastNames: string;
  institutionalEmail: string;
}

export type ImportRowStatus = 'valid' | 'duplicate' | 'error';

export interface ImportRowResult {
  /** Número de fila física en el archivo (1-based, incluye encabezado). */
  rowNumber: number;
  status: ImportRowStatus;
  message: string;
  data?: ImportRowData;
}

export interface ImportPreviewResponse {
  preview: ImportRowResult[];
  total: number;
  valid: number;
  duplicate: number;
  error: number;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export function isRowEmpty(row: unknown[]): boolean {
  return row.every((cell) => normalizeCell(cell) === '');
}

/** Primera fila que contiene TODAS las columnas requeridas (case-insensitive). */
export function findHeaderRowIndex(rawRows: unknown[][]): number {
  return rawRows.findIndex((row) =>
    REQUIRED_IMPORT_COLUMNS.every((col) =>
      row.some((cell) => normalizeCell(cell).toLowerCase() === col.toLowerCase()),
    ),
  );
}

export function buildColumnMap(
  headerRow: unknown[],
): Record<RequiredImportColumn, number> {
  const map = {} as Record<RequiredImportColumn, number>;
  for (const col of REQUIRED_IMPORT_COLUMNS) {
    const idx = headerRow.findIndex(
      (cell) => normalizeCell(cell).toLowerCase() === col.toLowerCase(),
    );
    if (idx === -1) {
      throw new BadRequestException(MISSING_COLUMNS_MESSAGE);
    }
    map[col] = idx;
  }
  return map;
}

export function validateParticipantRow(
  data: ImportRowData,
  rowNumber: number,
): ImportRowResult {
  if (!data.dni) {
    return { rowNumber, status: 'error', message: 'El DNI es obligatorio' };
  }
  if (!data.names) {
    return { rowNumber, status: 'error', message: 'Los nombres son obligatorios' };
  }
  if (!data.lastNames) {
    return { rowNumber, status: 'error', message: 'Los apellidos son obligatorios' };
  }
  if (!data.institutionalEmail) {
    return {
      rowNumber,
      status: 'error',
      message: 'El correo institucional es obligatorio',
    };
  }
  if (!EMAIL_REGEX.test(data.institutionalEmail)) {
    return {
      rowNumber,
      status: 'error',
      message: 'El correo institucional no es válido',
    };
  }
  return { rowNumber, status: 'valid', message: 'Fila válida', data };
}

/**
 * Convierte el JSON de una hoja (array de arrays, fila 1 = encabezado) en
 * resultados por fila. Lanza 400 con el mensaje exacto del Spec si el archivo
 * no contiene filas de datos o si faltan columnas requeridas.
 */
export function buildRowResults(rawRows: unknown[][]): ImportRowResult[] {
  const nonEmptyRows = rawRows.filter((row) => !isRowEmpty(row));
  if (nonEmptyRows.length === 0) {
    throw new BadRequestException(EMPTY_FILE_MESSAGE);
  }

  const headerIndex = findHeaderRowIndex(rawRows);
  if (headerIndex === -1) {
    throw new BadRequestException(MISSING_COLUMNS_MESSAGE);
  }

  const columnMap = buildColumnMap(rawRows[headerIndex]);
  const results: ImportRowResult[] = [];
  const seenDnis = new Set<string>();

  for (let i = headerIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (isRowEmpty(row)) continue;

    const rowNumber = i + 1;
    const data: ImportRowData = {
      dni: normalizeCell(row[columnMap.dni]),
      names: normalizeCell(row[columnMap.names]),
      lastNames: normalizeCell(row[columnMap.lastNames]),
      institutionalEmail: normalizeCell(row[columnMap.institutionalEmail]),
    };

    const dniKey = data.dni.toLowerCase();
    if (data.dni && seenDnis.has(dniKey)) {
      results.push({
        rowNumber,
        status: 'duplicate',
        message: 'El DNI ya aparece en una fila anterior del archivo',
      });
      continue;
    }
    if (data.dni) seenDnis.add(dniKey);

    results.push(validateParticipantRow(data, rowNumber));
  }

  if (results.length === 0) {
    throw new BadRequestException(EMPTY_FILE_MESSAGE);
  }

  return results;
}

export function summarizeResults(
  results: ImportRowResult[],
  previewLimit = 10,
): ImportPreviewResponse {
  const valid = results.filter((r) => r.status === 'valid').length;
  const duplicate = results.filter((r) => r.status === 'duplicate').length;
  const error = results.filter((r) => r.status === 'error').length;

  return {
    preview: results.slice(0, previewLimit),
    total: results.length,
    valid,
    duplicate,
    error,
  };
}