import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export type InstitutionalSettingDocument = InstitutionalSetting & Document;

@Schema({ timestamps: true })
export class InstitutionalSetting {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  location: string;

  @Prop({ type: SchemaTypes.Mixed, required: false })
  colors: {
    primary: string;
    secondary: string;
    white: string;
    gray: string;
    success: string;
    danger: string;
  };

  @Prop({ required: false })
  logo: string;

  @Prop({ default: 10485760 }) // 10MB
  maxFileSizeBytes: number;

  @Prop({ type: [String], default: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3'] })
  allowedFileTypes: string[];

  @Prop({ default: 30 }) // días
  trashRetentionDays: number;

  @Prop({ required: false })
  archiveTime: number; // días

  @Prop({ type: SchemaTypes.Mixed, required: false })
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };

  @Prop({ default: 'America/Lima' })
  timezone: string;

  @Prop({ type: SchemaTypes.Mixed, required: false })
  examMessages: {
    defaultWarning: string;
    focusLost: string;
    tabChange: string;
  };

  @Prop({ type: SchemaTypes.Mixed, required: false })
  smtpConfig: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    from: string;
  };

  @Prop({ default: false })
  otpEnabled: boolean;
}

export const InstitutionalSettingSchema = SchemaFactory.createForClass(InstitutionalSetting);
