import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type MonitoringDocument = Monitoring & Document;

@Schema({ _id: false })
export class TeacherProgress {
  @Prop({ type: String, ref: 'User', required: true })
  teacherId: Types.ObjectId;

  @Prop({ type: String, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ required: true })
  totalWeeks: number;

  @Prop({ required: true })
  completedWeeks: number;

  @Prop({ required: true })
  totalSessions: number;

  @Prop({ required: true })
  completedSessions: number;

  @Prop({ required: true })
  materialsPublished: number;

  @Prop({ required: true })
  tasksCreated: number;

  @Prop({ required: true })
  examsPublished: number;

  @Prop({ required: true })
  forumsCreated: number;

  @Prop({ required: true })
  attendanceRegistered: number;

  @Prop({ type: Date, required: false })
  lastActivity: Date;

  @Prop({ required: true })
  progressPercentage: number;
}

export const TeacherProgressSchema = SchemaFactory.createForClass(TeacherProgress);

@Schema({ _id: false })
export class StudentProgress {
  @Prop({ type: String, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: String, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ required: true })
  attendancePercentage: number;

  @Prop({ required: true })
  tasksSubmitted: number;

  @Prop({ required: true })
  tasksPending: number;

  @Prop({ required: true })
  examsCompleted: number;

  @Prop({ required: false })
  averageGrade: number;

  @Prop({ required: true })
  forumParticipation: number;

  @Prop({ type: Date, required: false })
  lastConnection: Date;

  @Prop({ required: true })
  progressPercentage: number;
}

export const StudentProgressSchema = SchemaFactory.createForClass(StudentProgress);

@Schema({ timestamps: true })
export class Monitoring {
  @Prop({ type: String, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: [TeacherProgress], default: [] })
  teacherProgress: TeacherProgress[];

  @Prop({ type: [StudentProgress], default: [] })
  studentProgress: StudentProgress[];

  @Prop({ type: Date, required: false })
  lastUpdated: Date;
}

export const MonitoringSchema = SchemaFactory.createForClass(Monitoring);

// Índices
MonitoringSchema.index({ courseId: 1 });
MonitoringSchema.index({ 'teacherProgress.teacherId': 1 });
MonitoringSchema.index({ 'studentProgress.studentId': 1 });
