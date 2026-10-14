import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type ForumDocument = Forum & Document;

@Schema({ _id: false })
export class ForumPost {
  @Prop({ type: String, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ required: false })
  editedAt: Date;

  @Prop({ type: [String], default: [] })
  attachments: string[]; // fileIds

  @Prop({ type: [{ type: String, ref: 'User' }], default: [] })
  reactions: Types.ObjectId[];

  @Prop({ type: SchemaTypes.Mixed, default: [] })
  replies: any[];
}

export const ForumPostSchema = SchemaFactory.createForClass(ForumPost);

@Schema({ _id: false })
export class ForumEvaluation {
  @Prop({ type: String, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: false })
  score: number;

  @Prop({ required: false })
  feedback: string;

  @Prop({ type: Date, default: Date.now })
  evaluatedAt: Date;
}

export const ForumEvaluationSchema = SchemaFactory.createForClass(ForumEvaluation);

@Schema({ timestamps: true })
export class Forum {
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

  @Prop({ type: [ForumPost], default: [] })
  posts: ForumPost[];

  @Prop({ required: false })
  isLocked: boolean;

  @Prop({ required: false })
  isPinned: boolean;

  @Prop({ default: false })
  isEvaluated: boolean;

  @Prop({ type: Date, required: false })
  availableFrom: Date;

  @Prop({ type: [ForumEvaluation], default: [] })
  evaluations: ForumEvaluation[];
}

export const ForumSchema = SchemaFactory.createForClass(Forum);

// Índices
ForumSchema.index({ courseId: 1 });
ForumSchema.index({ courseId: 1, weekNumber: 1, sessionNumber: 1 });
