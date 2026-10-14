import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { Meeting, MeetingSchema } from './schemas/meeting.schema';
import { MeetingSession, MeetingSessionSchema } from './schemas/meeting-session.schema';
import { Course, CourseSchema } from '@modules/courses/schemas/course.schema';
import { User, UserSchema } from '@modules/users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Meeting.name, schema: MeetingSchema },
      { name: MeetingSession.name, schema: MeetingSessionSchema },
      { name: Course.name, schema: CourseSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService],
  exports: [MeetingsService],
})
export class MeetingsModule {}
