import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserNotification, UserNotificationDocument } from './schemas/notification.schema';

export interface NotificationInput {
  userId: string;
  type: string;
  title: string;
  message?: string;
  courseId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(UserNotification.name)
    private readonly notificationModel: Model<UserNotificationDocument>,
  ) {}

  async create(input: NotificationInput): Promise<UserNotificationDocument> {
    const notification = new this.notificationModel(input);
    return notification.save();
  }

  async findByUser(userId: string, unreadOnly = false): Promise<UserNotificationDocument[]> {
    const query: any = { userId };
    if (unreadOnly) query.read = false;
    return this.notificationModel.find(query).sort({ createdAt: -1 }).limit(30).exec();
  }

  async markRead(id: string, userId: string): Promise<UserNotificationDocument> {
    return this.notificationModel.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true },
    ).exec();
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany({ userId, read: false }, { read: true }).exec();
  }
}