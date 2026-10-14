import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MeetingDocument = Meeting & Document;

export enum MeetingType {
  INTERNA = 'interna',
  EXTERNA = 'externa',
}

export enum MeetingPlatform {
  ZOOM = 'zoom',
  MEET = 'meet',
  TEAMS = 'teams',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Meeting {
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

  @Prop({ type: Date, required: true })
  scheduledDate: Date;

  @Prop({ type: Date, required: true })
  startTime: Date;

  @Prop({ type: Date, required: true })
  endTime: Date;

  @Prop({ type: String, enum: MeetingType, required: true })
  type: MeetingType;

  @Prop({ type: String, enum: MeetingPlatform, required: false })
  platform: MeetingPlatform;

  @Prop({ required: false })
  externalLink: string;

  @Prop({ required: false })
  meetingId: string;

  @Prop({ required: false })
  password: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  participants: Types.ObjectId[];

  @Prop({ required: false })
  recordingUrl: string;

  @Prop({ required: false })
  notes: string;
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);

// Índices
MeetingSchema.index({ courseId: 1 });
MeetingSchema.index({ courseId: 1, weekNumber: 1, sessionNumber: 1 });
MeetingSchema.index({ scheduledDate: 1 });
