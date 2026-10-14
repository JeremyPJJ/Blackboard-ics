import { extname } from 'path';
import { memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

/**
 * Configuración de subida para la importación masiva de participantes.
 * - Memory storage: el buffer se parsea directo con la librería `xlsx` (sin tocar disco).
 * - Límite de 5 MB (Spec: Bulk Import — "upload limited to a maximum size of 5 MB").
 * - MIME whitelist: solo .xlsx y .csv (Spec: "MUST accept only .xlsx and .csv MIME types").
 */
export const IMPORT_FILE_FIELD = 'file';
export const IMPORT_MAX_SIZE_MB = 5;
export const IMPORT_MAX_SIZE_BYTES = IMPORT_MAX_SIZE_MB * 1024 * 1024;

/** MIME permitidos: .xlsx (hoja de cálculo OOXML) y .csv (text/csv y su alias application/csv). */
export const IMPORT_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
];

export const importUploadConfig: MulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: IMPORT_MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    const mimeOk = IMPORT_MIME_TYPES.includes(file.mimetype);

    if ((ext !== '.xlsx' && ext !== '.csv') || !mimeOk) {
      return cb(
        new BadRequestException('Solo se permiten archivos .xlsx o .csv'),
        false,
      );
    }

    cb(null, true);
  },
};