import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskSubmissionDocument = TaskSubmission & Document;

export enum SubmissionStatus {
  ENTREGADO = 'entregado',
  REVISADO = 'revisado',
  FUERA_DE_FECHA = 'fuera_de_fecha',
  SOLICITUD_PENDIENTE = 'solicitud_pendiente',
  ACEPTADA = 'aceptada',
  RECHAZADA = 'rechazada',
}

@Schema({ timestamps: true })
export class TaskSubmission {
  @Prop({ type: String, ref: 'Task', required: true })
  taskId: Types.ObjectId;

  @Prop({ type: String, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: String, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: [{ type: String, ref: 'FileMetadata' }], default: [] })
  fileIds: Types.ObjectId[];

  @Prop({ required: false })
  comments: string;

  @Prop({ type: String, enum: SubmissionStatus, default: SubmissionStatus.ENTREGADO })
  status: SubmissionStatus;

  @Prop({ type: Date, default: Date.now })
  submittedAt: Date;

  @Prop({ required: false })
  gradedAt: Date;

  @Prop({ required: false })
  gradedBy: Types.ObjectId;

  @Prop({ required: false })
  score: number;

  @Prop({ required: false })
  feedback: string;

  @Prop({ required: false })
  lateReason: string;

  @Prop({ required: false })
  isPublished: boolean;
}

export const TaskSubmissionSchema = SchemaFactory.createForClass(TaskSubmission);

// Índices
TaskSubmissionSchema.index({ taskId: 1 });
TaskSubmissionSchema.index({ courseId: 1 });
TaskSubmissionSchema.index({ studentId: 1 });
TaskSubmissionSchema.index({ taskId: 1, studentId: 1 });
