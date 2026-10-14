import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

export enum ConversationType {
  INDIVIDUAL = 'individual',
  GRUPAL = 'grupal',
}

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: String, enum: ConversationType, required: true })
  type: ConversationType;

  @Prop({ type: [String], ref: 'User', required: true })
  participants: Types.ObjectId[];

  @Prop({ type: String, ref: 'Course', required: false })
  courseId: Types.ObjectId;

  @Prop({ required: false })
  name: string; // Para conversaciones grupales

  @Prop({ type: String, ref: 'User', required: false })
  lastMessageBy: Types.ObjectId;

  @Prop({ type: Date, required: false })
  lastMessageAt: Date;

  @Prop({ required: false })
  lastMessageContent: string;

  @Prop({ type: Map, of: Date, default: {} })
  lastReadAt: Map<string, Date>; // userId -> Date

  @Prop({ required: false })
  isActive: boolean;

  // Archivo por usuario (Spec O6a): la conversación se oculta SOLO para los
  // userIds incluidos; isActive global se conserva intacto como flag de alta.
  @Prop({ type: [String], default: [] })
  archivedBy: string[];
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Índices
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ courseId: 1 });
ConversationSchema.index({ lastMessageAt: -1 });
