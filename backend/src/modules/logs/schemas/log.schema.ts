import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LogDocument = Log & Document;

@Schema({ timestamps: true })
export class Log {
  @Prop({ required: true, default: 'info' })
  level: string; // 'info' | 'warn' | 'error' | 'debug'

  @Prop({ required: true, default: 'backend' })
  source: string; // 'backend' | 'frontend'

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object, required: false })
  meta: any;

  @Prop({ required: false })
  userId: string;

  @Prop({ required: false })
  method: string;

  @Prop({ required: false })
  url: string;

  @Prop({ required: false })
  statusCode: number;

  @Prop({ required: false })
  duration: number;
}

export const LogSchema = SchemaFactory.createForClass(Log);
LogSchema.index({ createdAt: -1 });