import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ImportLogDocument = ImportLog & Document;

export enum ImportStatus {
  PROCESANDO = 'procesando',
  COMPLETADO = 'completado',
  FALLIDO = 'fallido',
}

@Schema({ _id: false })
export class ImportResult {
  @Prop({ required: true })
  rowNumber: number;

  @Prop({ required: true })
  status: string; // 'success', 'duplicate', 'error'

  @Prop({ required: false })
  message: string;

  @Prop({ type: String, ref: 'User', required: false })
  userId?: Types.ObjectId;
}

export const ImportResultSchema = SchemaFactory.createForClass(ImportResult);

@Schema({ timestamps: true })
export class ImportLog {
  @Prop({ type: String, ref: 'Course', required: false })
  courseId: Types.ObjectId;

  @Prop({ type: String, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  fileType: string; // 'excel', 'csv'

  @Prop({ required: true })
  totalRows: number;

  @Prop({ required: true })
  processedRows: number;

  @Prop({ required: true })
  successRows: number;

  @Prop({ required: true })
  duplicateRows: number;

  @Prop({ required: true })
  errorRows: number;

  @Prop({ type: String, enum: ImportStatus, default: ImportStatus.PROCESANDO })
  status: ImportStatus;

  @Prop({ type: [ImportResult], default: [] })
  results: ImportResult[];

  @Prop({ required: false })
  errorMessage: string;

  @Prop({ type: Date, required: false })
  completedAt: Date;
}

export const ImportLogSchema = SchemaFactory.createForClass(ImportLog);

// Índices
ImportLogSchema.index({ courseId: 1 });
ImportLogSchema.index({ uploadedBy: 1 });
ImportLogSchema.index({ status: 1 });
