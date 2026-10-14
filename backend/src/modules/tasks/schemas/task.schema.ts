import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

export enum TaskStatus {
  BORRADOR = 'borrador',
  PUBLICADA = 'publicada',
}

export enum GradingType {
  MANUAL = 'manual',
  AUTOMATICA = 'automatica',
}

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  description: string;

  @Prop({ type: String, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ required: true })
  weekNumber: number;

  @Prop({ required: true })
  sessionNumber: number;

  @Prop({ type: Date, required: false })
  deadline: Date;

  @Prop({ default: false })
  noDeadline: boolean;

  @Prop({ type: [String], default: ['pdf', 'doc', 'docx'] })
  allowedTypes: string[];

  @Prop({ default: 10485760 }) // 10MB
  maxFileSize: number;

  @Prop({ default: 1 })
  maxFiles: number;

  @Prop({ type: String, enum: TaskStatus, default: TaskStatus.BORRADOR })
  status: TaskStatus;

  @Prop({ type: String, enum: GradingType, default: GradingType.MANUAL })
  gradingType: GradingType;

  @Prop({ required: false })
  maxScore: number;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

// Índices
TaskSchema.index({ courseId: 1 });
TaskSchema.index({ courseId: 1, weekNumber: 1, sessionNumber: 1 });
