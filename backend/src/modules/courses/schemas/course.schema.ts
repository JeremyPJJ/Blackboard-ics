import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type CourseDocument = Course & Document;

export enum CourseStatus {
  ACTIVO = 'activo',
  FINALIZADO = 'finalizado',
  CADUCADO = 'caducado',
  ARCHIVADO = 'archivado',
}

@Schema({ _id: false })
export class Material {
  @Prop({ required: true })
  type: string; // 'pdf', 'video', 'image', 'document', etc.

  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  description: string;

  @Prop({ type: String, ref: 'FileMetadata', required: false })
  fileId: Types.ObjectId;

  @Prop({ required: false })
  url: string; // Para videos de YouTube, enlaces externos, etc.
}

export const MaterialSchema = SchemaFactory.createForClass(Material);

@Schema({ _id: false })
export class Session {
  @Prop({ required: true })
  number: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  description: string;

  @Prop({ type: Date, required: false })
  scheduledDate: Date;

  @Prop({ type: [Material], default: [] })
  materials: Material[];
}

export const SessionSchema = SchemaFactory.createForClass(Session);

@Schema({ _id: false })
export class Week {
  @Prop({ required: true })
  number: number;

  @Prop({ required: false })
  title: string;

  @Prop({ required: false })
  description: string;

  @Prop({ type: [Material], default: [] })
  materials: Material[];

  @Prop({ type: [Session], default: [] })
  sessions: Session[];

  @Prop({ type: Date, required: false })
  createdAt: Date;
}

export const WeekSchema = SchemaFactory.createForClass(Week);

@Schema({ _id: false })
export class Enrollment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  role: string; // 'teacher' o 'student'

  @Prop({ type: Date, default: Date.now })
  enrolledAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  addedBy: Types.ObjectId; // quién agregó al participante
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

@Schema({ _id: false })
export class InvitationConfig {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: false })
  expiresAt: Date;

  @Prop({ required: false })
  maxUses: number;

  @Prop({ default: 0 })
  currentUses: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const InvitationConfigSchema = SchemaFactory.createForClass(InvitationConfig);

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: false })
  coverImage: string;

  @Prop({ required: true })
  career: string;

  @Prop({ required: false })
  credits: number;

  @Prop({ required: false })
  year: number;

  @Prop({ required: false })
  semester: number;

  @Prop({ required: false })
  cycle: number;

  @Prop({ type: [Enrollment], default: [] })
  teachers: Enrollment[];

  @Prop({ type: [Enrollment], default: [] })
  students: Enrollment[];

  @Prop({ type: [Week], default: [] })
  weeks: Week[];

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({ type: Date, required: false })
  expirationDate: Date;

  @Prop({ type: String, enum: CourseStatus, default: CourseStatus.ACTIVO })
  status: CourseStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  createdBy: Types.ObjectId; // autor/creador del curso

  @Prop({ type: SchemaTypes.Mixed, required: false })
  gradebookConfig: any; // { variables: [{key,label,weight,source}], manualScores: { "userId|KEY": number } }

  @Prop({ type: InvitationConfig, required: false })
  invitationConfig: InvitationConfig;

  @Prop({ required: false })
  deletedAt: Date;

  @Prop({ required: false })
  deletedBy: Types.ObjectId;

  @Prop({ required: false })
  restoreUntil: Date;
}

export const CourseSchema = SchemaFactory.createForClass(Course);

// Índices
CourseSchema.index({ code: 1 });
CourseSchema.index({ 'teachers.userId': 1 });
CourseSchema.index({ 'students.userId': 1 });
CourseSchema.index({ career: 1 });
CourseSchema.index({ status: 1 });
CourseSchema.index({ 'invitationConfig.code': 1 });
