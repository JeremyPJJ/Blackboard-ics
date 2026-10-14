import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AttendanceRegisterDocument = AttendanceRegister & Document;

export enum AttendanceStatus {
  PRESENTE = 'presente',
  TARDANZA = 'tardanza',
  AUSENTE = 'ausente',
  JUSTIFICADO = 'justificado',
}

@Schema({ _id: false })
export class AttendanceRecord {
  @Prop({ type: String, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: String, enum: AttendanceStatus, required: true })
  status: AttendanceStatus;

  @Prop({ required: false })
  markedAt: Date;

  @Prop({ type: String, ref: 'User', required: false })
  modifiedBy: Types.ObjectId;

  @Prop({ required: false })
  modifiedAt: Date;

  @Prop({ required: false })
  reason: string;
}

export const AttendanceRecordSchema = SchemaFactory.createForClass(AttendanceRecord);

@Schema({ _id: false })
export class AttendanceDate {
  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: Date, required: true })
  startTime: Date;

  @Prop({ type: Date, required: true })
  endTime: Date;

  @Prop({ required: true })
  weekNumber: number;

  @Prop({ required: true })
  sessionNumber: number;

  @Prop({ type: [AttendanceRecord], default: [] })
  records: AttendanceRecord[];
}

export const AttendanceDateSchema = SchemaFactory.createForClass(AttendanceDate);

@Schema({ timestamps: true })
export class AttendanceRegister {
  @Prop({ type: String, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: [AttendanceDate], default: [] })
  dates: AttendanceDate[];
}

export const AttendanceRegisterSchema = SchemaFactory.createForClass(AttendanceRegister);

// Índices
AttendanceRegisterSchema.index({ courseId: 1 });
