import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserNotificationDocument = UserNotification & Document;

@Schema({ timestamps: true })
export class UserNotification {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  type: string; // 'course_archived', 'course_restored', 'task_graded', etc.

  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  message: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ required: false })
  courseId: string;
}

export const UserNotificationSchema = SchemaFactory.createForClass(UserNotification);
UserNotificationSchema.index({ userId: 1, createdAt: -1 });