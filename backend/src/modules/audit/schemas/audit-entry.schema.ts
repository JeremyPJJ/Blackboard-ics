import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type AuditEntryDocument = AuditEntry & Document;

@Schema({ timestamps: true })
export class AuditEntry {
  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ type: SchemaTypes.Mixed, required: true })
  dateComponents: {
    day: number;
    month: number;
    year: number;
    hour: number;
    minute: number;
  };

  @Prop({ type: String, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  userRole: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  module: string;

  @Prop({ required: false })
  resource: string;

  @Prop({ type: SchemaTypes.Mixed, required: false })
  parameters: any;

  @Prop({ type: SchemaTypes.Mixed, required: false })
  previousState: any;

  @Prop({ type: SchemaTypes.Mixed, required: false })
  newState: any;

  @Prop({ required: false })
  ip: string;

  @Prop({ required: false })
  userAgent: string;

  @Prop({ required: false })
  sessionId: string;

  @Prop({ required: true })
  result: string; // 'success', 'error', 'warning'
}

export const AuditEntrySchema = SchemaFactory.createForClass(AuditEntry);

// Índices
AuditEntrySchema.index({ timestamp: -1 });
AuditEntrySchema.index({ userId: 1 });
AuditEntrySchema.index({ module: 1 });
AuditEntrySchema.index({ action: 1 });
AuditEntrySchema.index({ 'dateComponents.year': 1, 'dateComponents.month': 1 });
