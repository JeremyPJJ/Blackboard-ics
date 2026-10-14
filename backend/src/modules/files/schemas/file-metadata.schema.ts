import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type FileMetadataDocument = FileMetadata & Document;

@Schema({ timestamps: true })
export class FileMetadata {
  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  sizeBytes: number;

  @Prop({ required: false })
  checksum: string;

  @Prop({ type: String, enum: ['local', 's3'], default: 'local' })
  storageStrategy: string;

  @Prop({ required: false })
  localPath: string;

  @Prop({ type: Object, required: false })
  s3Config: {
    bucket: string;
    region: string;
    key: string;
  };

  @Prop({ type: Object, required: true })
  context: {
    type: string; // 'material', 'submission', 'institutional_logo', etc.
    referenceId: Types.ObjectId;
  };

  @Prop({ type: String, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ required: false })
  deletedAt: Date;
}

export const FileMetadataSchema = SchemaFactory.createForClass(FileMetadata);

// Índices
FileMetadataSchema.index({ 'context.type': 1 });
FileMetadataSchema.index({ 'context.referenceId': 1 });
FileMetadataSchema.index({ uploadedBy: 1 });
