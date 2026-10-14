import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { Course, CourseSchema } from '../courses/schemas/course.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { AttendanceRegister, AttendanceRegisterSchema } from '../attendance/schemas/attendance-register.schema';
import { Forum, ForumSchema } from '../forums/schemas/forum.schema';
import { Exam, ExamSchema } from '../exams/schemas/exam.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Task.name, schema: TaskSchema },
      { name: AttendanceRegister.name, schema: AttendanceRegisterSchema },
      { name: Forum.name, schema: ForumSchema },
      { name: Exam.name, schema: ExamSchema },
    ]),
    UsersModule,
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}