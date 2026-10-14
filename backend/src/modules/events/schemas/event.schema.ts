import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  type: string; // 'USER_LOGIN', 'COURSE_CREATED', etc.

  @Prop({ required: true })
  module: string;

  @Prop({ required: false })
  actorId: string;

  @Prop({ required: false })
  actorRole: string;

  @Prop({ required: false })
  targetId: string;

  @Prop({ required: false })
  targetType: string;

  @Prop({ type: SchemaTypes.Mixed, required: false })
  payload: any;

  @Prop({ type: Date, default: Date.now })
  occurredAt: Date;

  @Prop({ required: false })
  processed: boolean;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// Índices
EventSchema.index({ type: 1 });
EventSchema.index({ module: 1 });
EventSchema.index({ actorId: 1 });
EventSchema.index({ targetId: 1 });
EventSchema.index({ occurredAt: -1 });
EventSchema.index({ processed: 1 });
