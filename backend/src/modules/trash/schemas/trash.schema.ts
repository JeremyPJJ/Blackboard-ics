import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type TrashDocument = Trash & Document;

export enum TrashType {
  COURSE = 'course',
  USER = 'user',
  TASK = 'task',
  EXAM = 'exam',
  FORUM = 'forum',
  MATERIAL = 'material',
}

@Schema({ timestamps: true })
export class Trash {
  @Prop({ type: String, enum: TrashType, required: true })
  type: TrashType;

  @Prop({ type: String, required: true })
  originalCollection: string;

  @Prop({ type: SchemaTypes.Mixed, required: true })
  document: any;

  @Prop({ type: String, ref: 'User', required: true })
  deletedBy: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  deletedAt: Date;

  @Prop({ type: Date, required: true })
  restoreUntil: Date;

  @Prop({ required: false })
  reason: string;

  @Prop({ required: false })
  restoredAt: Date;

  @Prop({ type: String, ref: 'User', required: false })
  restoredBy: Types.ObjectId;

  @Prop({ required: false })
  isRestored: boolean;

  @Prop({ required: false })
  permanentlyDeletedAt: Date;

  /** Estado de error al intentar restaurar (p. ej. el documento original fue eliminado de forma permanente). */
  @Prop({ required: false })
  restoreError: string;
}

export const TrashSchema = SchemaFactory.createForClass(Trash);

// Índices
TrashSchema.index({ type: 1 });
TrashSchema.index({ deletedAt: 1 });
TrashSchema.index({ restoreUntil: 1 });
TrashSchema.index({ deletedBy: 1 });
