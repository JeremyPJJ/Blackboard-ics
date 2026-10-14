import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcryptjs';
import { ImportLog, ImportLogDocument, ImportStatus, ImportResult } from './schemas/import-log.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import {
  buildRowResults,
  summarizeResults,
  ImportRowResult,
  ImportPreviewResponse,
} from './import.utils';

/**
 * Contraseña inicial para estudiantes creados vía importación masiva.
 * El Spec no define la contraseña inicial; se deriva del DNI (mín. 8 chars,
 * letras + números) y queda documentada para que el estudiante la cambie.
 */
export function initialImportPassword(dni: string): string {
  return `${dni}Temp`;
}

@Injectable()
export class ImportService {
  constructor(
    @InjectModel(ImportLog.name) private readonly importLogModel: Model<ImportLogDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
  ) {}

  // ---------------------------------------------------------------------------
  // Bulk Import de participantes (Spec: Bulk Import)
  // ---------------------------------------------------------------------------

  private async assertCourseExists(courseId: string): Promise<void> {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course || course.deletedAt) {
      throw new NotFoundException('Curso no encontrado');
    }
  }

  /** Parsea buffer .xlsx/.csv con `xlsx` y devuelve la validación fila por fila. */
  parseAndValidateRows(buffer: Buffer): ImportRowResult[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('El archivo no contiene filas de datos');
    }
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
    return buildRowResults(rawRows);
  }

  /**
   * Preview: hasta 10 filas + resumen total/valid/duplicate/error.
   * No persiste nada (Spec: "returns a preview with up to 10 rows and a
   * summary of total, valid, duplicate and error rows").
   */
  async previewParticipants(buffer: Buffer, courseId: string): Promise<ImportPreviewResponse> {
    await this.assertCourseExists(courseId);
    const results = this.parseAndValidateRows(buffer);
    return summarizeResults(results);
  }

  /**
   * Confirm: crea/actualiza usuarios, los inscribe en el curso y registra un
   * ImportLog con status `completado` y resultados por fila. El procesamiento
   * por fila está aislado (try/catch) para que un error puntual de Mongo no
   * aborte la importación (Spec: "row-level errors for invalid data").
   */
  async confirmParticipants(
    buffer: Buffer,
    courseId: string,
    uploadedBy: string,
    fileName: string,
  ): Promise<{ importLogId: string; results: Pick<ImportResult, 'rowNumber' | 'status' | 'message'>[] }> {
    await this.assertCourseExists(courseId);
    const results = this.parseAndValidateRows(buffer);
    const confirmResults: ImportResult[] = [];

    for (const row of results) {
      if (row.status !== 'valid' || !row.data) {
        confirmResults.push({
          rowNumber: row.rowNumber,
          status: row.status,
          message: row.message,
        });
        continue;
      }

      const data = row.data;
      try {
        const userId = await this.upsertAndEnroll(courseId, data);
        confirmResults.push({
          rowNumber: row.rowNumber,
          status: 'success',
          message: 'Usuario creado/actualizado e inscrito en el curso',
          userId: new Types.ObjectId(userId),
        });
      } catch (error: any) {
        confirmResults.push({
          rowNumber: row.rowNumber,
          status: 'error',
          message: error?.message ?? 'Error inesperado al procesar la fila',
        });
      }
    }

    const successRows = confirmResults.filter((r) => r.status === 'success').length;
    const duplicateRows = confirmResults.filter((r) => r.status === 'duplicate').length;
    const errorRows = confirmResults.filter((r) => r.status === 'error').length;

    const importLog = await this.importLogModel.create({
      courseId,
      uploadedBy,
      fileName,
      fileType: fileName.toLowerCase().endsWith('.csv') ? 'csv' : 'excel',
      totalRows: results.length,
      processedRows: results.length,
      successRows,
      duplicateRows,
      errorRows,
      status: ImportStatus.COMPLETADO,
      results: confirmResults,
      completedAt: new Date(),
    });

    return {
      importLogId: importLog._id.toString(),
      results: confirmResults.map(({ rowNumber, status, message }) => ({
        rowNumber,
        status,
        message,
      })),
    };
  }

  /** Create-or-update del usuario por dni o correo institucional + inscripción idempotente. */
  private async upsertAndEnroll(
    courseId: string,
    data: { dni: string; names: string; lastNames: string; institutionalEmail: string },
  ): Promise<string> {
    // Create-or-update: primero por DNI, luego por correo institucional.
    let user = await this.userModel
      .findOne({ dni: data.dni, deletedAt: { $exists: false } })
      .exec();
    if (!user) {
      user = await this.userModel
        .findOne({ institutionalEmail: data.institutionalEmail, deletedAt: { $exists: false } })
        .exec();
    }

    if (user) {
      await this.userModel.updateOne(
        { _id: user._id },
        {
          $set: {
            names: data.names,
            lastNames: data.lastNames,
            institutionalEmail: data.institutionalEmail,
          },
        },
      ).exec();
    } else {
      const hashedPassword = await bcrypt.hash(initialImportPassword(data.dni), 10);
      const created = await this.userModel.create({
        dni: data.dni,
        names: data.names,
        lastNames: data.lastNames,
        institutionalEmail: data.institutionalEmail,
        password: hashedPassword,
        role: 'estudiante',
        status: 'activo',
      });
      user = created;
    }

    // Inscripción idempotente: solo se agrega si el estudiante aún no está.
    await this.courseModel.updateOne(
      { _id: courseId, 'students.userId': { $ne: user._id } },
      { $push: { students: { userId: user._id, role: 'student', enrolledAt: new Date() } } },
    ).exec();

    return user._id.toString();
  }

  // ---------------------------------------------------------------------------
  // CRUD pre-existente de ImportLog (sin cambios de comportamiento)
  // ---------------------------------------------------------------------------

  async createImportLog(importData: any): Promise<ImportLogDocument> {
    const importLog = new this.importLogModel(importData);
    return importLog.save();
  }

  async findAll(filters?: { courseId?: string; status?: ImportStatus }): Promise<ImportLogDocument[]> {
    const query: any = {};
    if (filters?.courseId) query.courseId = filters.courseId;
    if (filters?.status) query.status = filters.status;
    return this.importLogModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<ImportLogDocument> {
    const importLog = await this.importLogModel.findById(id).exec();
    if (!importLog) {
      throw new NotFoundException('Registro de importación no encontrado');
    }
    return importLog;
  }

  async updateStatus(
    id: string,
    status: ImportStatus,
    errorMessage?: string,
  ): Promise<ImportLogDocument> {
    const updateData: any = {
      status,
      completedAt: new Date(),
    };

    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    const importLog = await this.importLogModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!importLog) {
      throw new NotFoundException('Registro de importación no encontrado');
    }

    return importLog;
  }

  async addResult(
    id: string,
    result: any,
  ): Promise<ImportLogDocument> {
    const importLog = await this.findById(id);
    importLog.results.push(result);
    importLog.processedRows += 1;

    if (result.status === 'success') {
      importLog.successRows += 1;
    } else if (result.status === 'duplicate') {
      importLog.duplicateRows += 1;
    } else if (result.status === 'error') {
      importLog.errorRows += 1;
    }

    return importLog.save();
  }
}