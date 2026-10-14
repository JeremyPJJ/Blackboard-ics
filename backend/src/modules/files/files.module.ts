import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FileMetadata, FileMetadataSchema } from './schemas/file-metadata.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: FileMetadata.name, schema: FileMetadataSchema }])],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
