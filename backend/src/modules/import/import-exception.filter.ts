import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';
import { IMPORT_MAX_SIZE_MB } from './import-upload.config';

/**
 * Convierte errores de multer (p.ej. LIMIT_FILE_SIZE al superar 5MB) en
 * respuestas de error estructuradas {statusCode, message, error} (Spec:
 * Error Handling — "All HTTP endpoints MUST return structured error
 * responses containing statusCode, message and error").
 */
@Catch(MulterError)
export class ImportExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception.code === 'LIMIT_FILE_SIZE') {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `El archivo supera el tamaño máximo de ${IMPORT_MAX_SIZE_MB}MB`,
        error: 'Bad Request',
      });
    }

    return response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: exception.message,
      error: 'Bad Request',
    });
  }
}