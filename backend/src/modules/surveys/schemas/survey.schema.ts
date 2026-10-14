import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type SurveyDocument = Survey & Document;

export enum SurveyType {
  ABIERTA = 'abierta',
  CERRADA = 'cerrada',
}

export enum QuestionType {
  SELECCION_UNICA = 'seleccion_unica',
  SELECCION_MULTIPLE = 'seleccion_multiple',
  ESCALA = 'escala',
  TEXTO = 'texto',
}

@Schema({ _id: false })
export class SurveyOption {
  @Prop({ required: true })
  text: string;

  @Prop({ required: false })
  value: number;
}

export const SurveyOptionSchema = SchemaFactory.createForClass(SurveyOption);

@Schema({ _id: false })
export class SurveyQuestion {
  @Prop({ required: true })
  text: string;

  @Prop({ type: String, enum: QuestionType, required: true })
  type: QuestionType;

  @Prop({ type: [SurveyOption], required: false })
  options: SurveyOption[];

  @Prop({ required: false })
  required: boolean;

  @Prop({ required: false })
  minScale: number;

  @Prop({ required: false })
  maxScale: number;
}

export const SurveyQuestionSchema = SchemaFactory.createForClass(SurveyQuestion);

@Schema({ _id: false })
export class SurveyResponse {
  @Prop({ type: String, ref: 'User', required: false })
  userId: Types.ObjectId;

  @Prop({ type: SchemaTypes.Mixed, required: true })
  answers: any;

  @Prop({ type: Date, default: Date.now })
  submittedAt: Date;
}

export const SurveyResponseSchema = SchemaFactory.createForClass(SurveyResponse);

@Schema({ timestamps: true })
export class Survey {
  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  description: string;

  @Prop({ type: String, ref: 'Course', required: false })
  courseId: Types.ObjectId;

  @Prop({ type: String, enum: SurveyType, required: true })
  type: SurveyType;

  @Prop({ default: 'estudiante' })
  targetRole: string; // 'estudiante' | 'docente' | 'todos'

  @Prop({ type: String, ref: 'User', required: false })
  createdBy: Types.ObjectId;

  @Prop({ type: [SurveyQuestion], required: true })
  questions: SurveyQuestion[];

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({ required: false })
  isAnonymous: boolean;

  @Prop({ required: false })
  maxResponses: number;

  @Prop({ type: [SurveyResponse], default: [] })
  responses: SurveyResponse[];

  @Prop({ required: false })
  isActive: boolean;
}

export const SurveySchema = SchemaFactory.createForClass(Survey);

// Índices
SurveySchema.index({ courseId: 1 });
SurveySchema.index({ startDate: 1, endDate: 1 });
