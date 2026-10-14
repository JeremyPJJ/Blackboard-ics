import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  UNIDAD_ACADEMICA = 'unidad_academica',
  SECRETARIA = 'secretaria',
  SOPORTE = 'soporte',
  DOCENTE = 'docente',
  ESTUDIANTE = 'estudiante',
}

export enum UserStatus {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  dni: string;

  @Prop({ required: true })
  names: string;

  @Prop({ required: true })
  lastNames: string;

  @Prop({ required: true, unique: true })
  institutionalEmail: string;

  @Prop({ required: false })
  personalEmail: string;

  @Prop({ required: false })
  phone: string;

  @Prop({ required: false })
  birthDate: Date;

  @Prop({ required: false })
  photo: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: UserRole, required: true })
  role: UserRole;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ required: false })
  contractYear: number;

  @Prop({ required: false })
  contractSemester: number;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.ACTIVO })
  status: UserStatus;

  @Prop({ required: false })
  lastLogin: Date;

  @Prop({ required: false })
  deletedAt: Date;

  @Prop({ required: false })
  deletedBy: Types.ObjectId;

  @Prop({ required: false })
  restoreUntil: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Índices
UserSchema.index({ institutionalEmail: 1 });
UserSchema.index({ dni: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ 'tags': 1 });
