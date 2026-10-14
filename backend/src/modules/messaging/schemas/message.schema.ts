import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

export enum MessageType {
  TEXTO = 'texto',
  IMAGEN = 'imagen',
  ARCHIVO = 'archivo',
  AUDIO = 'audio',
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: String, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ type: String, ref: 'Conversation', required: true })
  conversationId: Types.ObjectId;

  @Prop({ type: String, enum: MessageType, required: true })
  type: MessageType;

  @Prop({ required: false })
  content: string;

  @Prop({ required: false })
  fileUrl: string;

  @Prop({ required: false })
  fileName: string;

  @Prop({ required: false })
  fileSize: number;

  @Prop({ required: false })
  mimeType: string;

  @Prop({ type: Date, default: Date.now })
  sentAt: Date;

  @Prop({ required: false })
  readAt: Date;

  @Prop({ required: false })
  deletedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Índices
MessageSchema.index({ conversationId: 1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ sentAt: -1 });
