import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ForumsController } from './forums.controller';
import { ForumsService } from './forums.service';
import { Forum, ForumSchema } from './schemas/forum.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Forum.name, schema: ForumSchema }])],
  controllers: [ForumsController],
  providers: [ForumsService],
  exports: [ForumsService],
})
export class ForumsModule {}
