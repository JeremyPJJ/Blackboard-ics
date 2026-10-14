import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UseFilters,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { ImportService } from './import.service';
import { ImportStatus } from './schemas/import-log.schema';
import { importUploadConfig, IMPORT_FILE_FIELD } from './import-upload.config';
import { ImportExceptionFilter } from './import-exception.filter';

@Controller('import')
@UseGuards(AuthGuard('jwt'))
@UseFilters(ImportExceptionFilter)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  // ---------------------------------------------------------------------------
  // Bulk Import de participantes (Spec: Bulk Import) — subida .xlsx/.csv
  // ---------------------------------------------------------------------------

  /**
   * Preview: parsea el archivo y devuelve hasta 10 filas + resumen
   * (total/valid/duplicate/error). No persiste nada. Archivo vacío → 400
   * "El archivo no contiene filas de datos" (Spec: empty file).
   */
  @Post('participants/preview')
  @UseGuards(PermissionsGuard)
  @Permission('importar.participantes')
  @UseInterceptors(FileInterceptor(IMPORT_FILE_FIELD, importUploadConfig))
  previewParticipants(
    @UploadedFile() file: Express.Multer.File,
    @Body('courseId') courseId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Debes adjuntar un archivo .xlsx o .csv');
    }
    return this.importService.previewParticipants(file.buffer, courseId);
  }

  /**
   * Confirm: crea/actualiza usuarios, los inscribe en el curso y guarda el
   * ImportLog con status `completado` y resultados por fila.
   */
  @Post('participants/confirm')
  @UseGuards(PermissionsGuard)
  @Permission('importar.participantes')
  @UseInterceptors(FileInterceptor(IMPORT_FILE_FIELD, importUploadConfig))
  confirmParticipants(
    @UploadedFile() file: Express.Multer.File,
    @Body('courseId') courseId: string,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('Debes adjuntar un archivo .xlsx o .csv');
    }
    return this.importService.confirmParticipants(
      file.buffer,
      courseId,
      req.user._id,
      file.originalname,
    );
  }

  // ---------------------------------------------------------------------------
  // CRUD pre-existente de ImportLog (sin cambios)
  // ---------------------------------------------------------------------------

  @Post()
  createImportLog(@Body() importData: any, @Request() req) {
    return this.importService.createImportLog({
      ...importData,
      uploadedBy: req.user._id,
    });
  }

  @Get()
  findAll(@Request() req) {
    return this.importService.findAll();
  }

  @Get('course/:courseId')
  findAllByCourse(@Param('courseId') courseId: string) {
    return this.importService.findAll({ courseId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.importService.findById(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ImportStatus,
    @Body('errorMessage') errorMessage: string,
  ) {
    return this.importService.updateStatus(id, status, errorMessage);
  }

  @Post(':id/results')
  addResult(@Param('id') id: string, @Body() result: any) {
    return this.importService.addResult(id, result);
  }
}