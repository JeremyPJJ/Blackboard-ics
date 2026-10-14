import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { UserNotification, UserNotificationSchema } from './schemas/notification.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: UserNotification.name, schema: UserNotificationSchema }])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}