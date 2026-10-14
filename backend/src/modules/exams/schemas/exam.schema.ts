import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type ExamDocument = Exam & Document;

export enum ExamStatus {
  BORRADOR = 'borrador',
  PUBLICADO = 'publicado',
  FINALIZADO = 'finalizado',
}

export enum QuestionType {
  OPCION_MULTIPLE = 'opcion_multiple',
  VERDADERO_FALSO = 'verdadero_falso',
  COMPLETAR = 'completar',
  DESARROLLO = 'desarrollo',
}

@Schema({ _id: false })
export class Option {
  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  isCorrect: boolean;
}

export const OptionSchema = SchemaFactory.createForClass(Option);

@Schema({ _id: false })
export class Question {
  @Prop({ required: true })
  text: string;

  @Prop({ type: String, enum: QuestionType, required: true })
  type: QuestionType;

  @Prop({ type: [Option], required: false })
  options: Option[];

  @Prop({ required: false })
  correctAnswer: string;

  @Prop({ required: true })
  points: number;

  @Prop({ required: false })
  explanation: string;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

@Schema({ _id: false })
export class SupervisionEvent {
  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ required: true })
  type: string; // 'tab_change', 'focus_lost', 'fullscreen_exit'

  @Prop({ required: false })
  details: string;
}

export const SupervisionEventSchema = SchemaFactory.createForClass(SupervisionEvent);

@Schema({ _id: false })
export class ExamAttempt {
  @Prop({ type: String, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  startedAt: Date;

  @Prop({ type: Date, required: false })
  finishedAt: Date;

  @Prop({ type: SchemaTypes.Mixed, required: false })
  answers: any;

  @Prop({ required: false })
  score: number;

  @Prop({ required: false })
  maxScore: number;

  @Prop({ type: [SupervisionEvent], default: [] })
  supervisionEvents: SupervisionEvent[];

  @Prop({ required: false })
  status: string; // 'in_progress', 'completed', 'abandoned'
}

export const ExamAttemptSchema = SchemaFactory.createForClass(ExamAttempt);

@Schema({ timestamps: true })
export class Exam {
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

  @Prop({ type: [Question], required: true })
  questions: Question[];

  @Prop({ type: Date, required: false })
  startDate: Date;

  @Prop({ type: Date, required: false })
  endDate: Date;

  @Prop({ required: true })
  duration: number; // minutos

  @Prop({ required: true })
  maxAttempts: number;

  @Prop({ type: String, enum: ExamStatus, default: ExamStatus.BORRADOR })
  status: ExamStatus;

  @Prop({ required: false })
  passingScore: number;

  @Prop({ required: false })
  shuffleQuestions: boolean;

  @Prop({ required: false })
  shuffleOptions: boolean;

  @Prop({ required: false })
  showResults: boolean;

  @Prop({ required: false })
  showCorrectAnswers: boolean;

  @Prop({ required: false })
  supervisionMessage: string;

  @Prop({ type: [ExamAttempt], default: [] })
  attempts: ExamAttempt[];
}

export const ExamSchema = SchemaFactory.createForClass(Exam);

// Índices
ExamSchema.index({ courseId: 1 });
ExamSchema.index({ courseId: 1, weekNumber: 1, sessionNumber: 1 });
ExamSchema.index({ 'attempts.studentId': 1 });
