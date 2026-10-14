import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type JobDocument = Job & Document;

export enum JobStatus {
  ACTIVA = 'activa',
  CERRADA = 'cerrada',
  EXPIRADA = 'expirada',
}

export enum ApplicationStatus {
  POSTULADO = 'postulado',
  EN_ANALISIS = 'en_analisis',
  FINALISTA = 'finalista',
  NO_SELECCIONADO = 'no_seleccionado',
}

export enum JobModality {
  PRESENCIAL = 'presencial',
  REMOTO = 'remoto',
  HIBRIDO = 'hibrido',
}

@Schema({ _id: false })
export class JobApplication {
  @Prop({ type: String, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  appliedAt: Date;

  @Prop({ type: String, enum: ApplicationStatus, default: ApplicationStatus.POSTULADO })
  status: ApplicationStatus;

  @Prop({ required: false })
  coverLetter: string;

  @Prop({ type: [String], default: [] })
  attachments: string[]; // fileIds

  @Prop({ required: false })
  notes: string;

  @Prop({ type: Date, required: false })
  reviewedAt: Date;

  @Prop({ type: String, ref: 'User', required: false })
  reviewedBy: Types.ObjectId;
}

export const JobApplicationSchema = SchemaFactory.createForClass(JobApplication);

@Schema({ timestamps: true })
export class Job {
  @Prop({ required: true })
  company: string;

  @Prop({ required: true })
  position: string;

  @Prop({ required: false })
  description: string;

  @Prop({ type: [String], required: false })
  requirements: string[];

  @Prop({ required: false })
  career: string;

  @Prop({ type: String, enum: JobModality, required: false })
  modality: JobModality;

  @Prop({ required: false })
  salary: string;

  @Prop({ type: Date, required: true })
  deadline: Date;

  @Prop({ type: String, enum: JobStatus, default: JobStatus.ACTIVA })
  status: JobStatus;

  @Prop({ type: [JobApplication], default: [] })
  applications: JobApplication[];

  @Prop({ type: String, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: false })
  contactEmail: string;

  @Prop({ required: false })
  contactPhone: string;

  @Prop({ required: false })
  location: string;
}

export const JobSchema = SchemaFactory.createForClass(Job);

// Índices
JobSchema.index({ career: 1 });
JobSchema.index({ status: 1 });
JobSchema.index({ deadline: 1 });
JobSchema.index({ 'applications.studentId': 1 });
