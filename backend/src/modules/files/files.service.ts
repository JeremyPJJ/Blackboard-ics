import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FileMetadata, FileMetadataDocument } from './schemas/file-metadata.schema';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  private readonly uploadPath: string;

  constructor(
    @InjectModel(FileMetadata.name)
    private readonly fileModel: Model<FileMetadataDocument>,
    private readonly configService: ConfigService,
  ) {
    this.uploadPath = this.configService.get('UPLOAD_PATH') || './uploads';
    
    // Crear directorio de uploads si no existe
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    contextType: string,
    referenceId: string,
    uploadedBy: string,
  ): Promise<FileMetadataDocument> {
    // Generar ruta única
    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(this.uploadPath, filename);

    // Guardar archivo en disco
    fs.writeFileSync(filePath, file.buffer);

    // Crear metadatos en MongoDB
    const fileMetadata = new this.fileModel({
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storageStrategy: 'local',
      localPath: filePath,
      context: {
        type: contextType,
        referenceId: referenceId as any,
      },
      uploadedBy: uploadedBy as any,
    });

    return fileMetadata.save();
  }

  async findById(id: string): Promise<FileMetadataDocument> {
    const file = await this.fileModel.findById(id).exec();
    if (!file || file.isDeleted) {
      throw new NotFoundException('Archivo no encontrado');
    }
    return file;
  }

  async findByContext(contextType: string, referenceId: string): Promise<FileMetadataDocument[]> {
    return this.fileModel.find({
      'context.type': contextType,
      'context.referenceId': referenceId,
      isDeleted: false,
    }).exec();
  }

  async download(id: string): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const file = await this.findById(id);

    if (file.storageStrategy === 'local') {
      if (!fs.existsSync(file.localPath)) {
        throw new NotFoundException('Archivo físico no encontrado');
      }

      const buffer = fs.readFileSync(file.localPath);
      return {
        buffer,
        mimeType: file.mimeType,
        filename: file.originalName,
      };
    }

    throw new NotFoundException('Estrategia de almacenamiento no implementada');
  }

  async remove(id: string): Promise<FileMetadataDocument> {
    const file = await this.findById(id);

    // Soft delete
    file.isDeleted = true;
    file.deletedAt = new Date();

    // Eliminar archivo físico (opcional, puede mantenerse por seguridad)
    if (file.storageStrategy === 'local' && fs.existsSync(file.localPath)) {
      fs.unlinkSync(file.localPath);
    }

    return file.save();
  }
}
