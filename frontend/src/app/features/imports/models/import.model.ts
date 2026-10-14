/**
 * Modelos del feature de importación masiva de participantes (Spec: Bulk Import).
 */

export interface ImportRowData {
  dni: string;
  names: string;
  lastNames: string;
  institutionalEmail: string;
}

export type ImportRowStatus = 'valid' | 'duplicate' | 'error';

/** Fila del preview LOCAL (parseo con `xlsx` en el navegador, solo visual). */
export interface LocalPreviewRow {
  rowNumber: number;
  dni: string;
  names: string;
  lastNames: string;
  institutionalEmail: string;
}

export interface ImportPreviewRow {
  rowNumber: number;
  status: ImportRowStatus;
  message: string;
  data?: ImportRowData;
}

/** Respuesta del endpoint de preview: hasta 10 filas + resumen (Spec). */
export interface ImportSummary {
  preview: ImportPreviewRow[];
  total: number;
  valid: number;
  duplicate: number;
  error: number;
}

export interface ImportRowResult {
  rowNumber: number;
  status: string;
  message: string;
}

/** Respuesta del endpoint de confirm (contrato del diseño). */
export interface ImportConfirmResponse {
  importLogId: string;
  results: ImportRowResult[];
}