import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FileMetadata, FileMetadataDocument } from './schemas/file-metadata.schema';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { createHash, randomUUID } from 'crypto';

@Injectable()
export class FilesService {
  private readonly uploadPath: string;
  private readonly inFlightUploads = new Map<string, Promise<FileMetadataDocument>>();
  private readonly recentUploads = new Map<string, { id: string; expiresAt: number }>();
  private static readonly DUPLICATE_WINDOW_MS = 10_000;

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
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    // Evita guardar dos veces la misma subida (doble clic, reintentos del cliente, etc.)
    const digest = createHash('sha256').update(file.buffer).digest('hex');
    const key = JSON.stringify([uploadedBy, contextType, referenceId, file.originalname, file.mimetype, digest]);
    this.pruneRecentUploads();

    const recent = this.recentUploads.get(key);
    if (recent) {
      const existing = await this.fileModel.findById(recent.id).exec();
      if (existing && !existing.isDeleted && fs.existsSync(existing.localPath)) {
        return existing;
      }
      this.recentUploads.delete(key);
    }

    const inFlight = this.inFlightUploads.get(key);
    if (inFlight) {
      return inFlight;
    }

    const task = this.saveUpload(file, contextType, referenceId, uploadedBy);
    this.inFlightUploads.set(key, task);
    try {
      const saved = await task;
      this.recentUploads.set(key, {
        id: saved._id.toString(),
        expiresAt: Date.now() + FilesService.DUPLICATE_WINDOW_MS,
      });
      return saved;
    } finally {
      this.inFlightUploads.delete(key);
    }
  }

  private async saveUpload(
    file: Express.Multer.File,
    contextType: string,
    referenceId: string,
    uploadedBy: string,
  ): Promise<FileMetadataDocument> {
    // Generar ruta única
    const filename = `${Date.now()}-${randomUUID()}-${path.basename(file.originalname)}`;
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

  private pruneRecentUploads(): void {
    const now = Date.now();
    for (const [key, entry] of this.recentUploads) {
      if (entry.expiresAt <= now) {
        this.recentUploads.delete(key);
      }
    }
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
