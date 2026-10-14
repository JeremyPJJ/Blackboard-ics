import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { CoursesModule } from '@modules/courses/courses.module';
import { TasksModule } from '@modules/tasks/tasks.module';
import { AttendanceModule } from '@modules/attendance/attendance.module';
import { FilesModule } from '@modules/files/files.module';
import { AuditModule } from '@modules/audit/audit.module';
import { SettingsModule } from '@modules/settings/settings.module';
import { ExamsModule } from '@modules/exams/exams.module';
import { ForumsModule } from '@modules/forums/forums.module';
import { MeetingsModule } from '@modules/meetings/meetings.module';
import { SurveysModule } from '@modules/surveys/surveys.module';
import { JobsModule } from '@modules/jobs/jobs.module';
import { MessagingModule } from '@modules/messaging/messaging.module';
import { MonitoringModule } from '@modules/monitoring/monitoring.module';
import { TrashModule } from '@modules/trash/trash.module';
import { ImportModule } from '@modules/import/import.module';
import { EventsModule } from '@modules/events/events.module';
import { LogsModule } from '@modules/logs/logs.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { StatsModule } from '@modules/stats/stats.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017', {
      dbName: process.env.MONGODB_DATABASE || 'plataforma_virtual',
    }),
    AuthModule,
    UsersModule,
    CoursesModule,
    TasksModule,
    AttendanceModule,
    FilesModule,
    AuditModule,
    SettingsModule,
    ExamsModule,
    ForumsModule,
    MeetingsModule,
    SurveysModule,
    JobsModule,
    MessagingModule,
    MonitoringModule,
    TrashModule,
    ImportModule,
    EventsModule,
    LogsModule,
    NotificationsModule,
    StatsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
