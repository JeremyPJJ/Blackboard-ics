import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrashController } from './trash.controller';
import { TrashService } from './trash.service';
import { Trash, TrashSchema } from './schemas/trash.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Trash.name, schema: TrashSchema }])],
  controllers: [TrashController],
  providers: [TrashService],
  exports: [TrashService],
})
export class TrashModule {}
