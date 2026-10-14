import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditEntry, AuditEntryDocument } from './schemas/audit-entry.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditEntry.name)
    private readonly auditModel: Model<AuditEntryDocument>,
  ) {}

  async log(entry: {
    userId: string;
    userRole: string;
    action: string;
    module: string;
    resource?: string;
    parameters?: any;
    previousState?: any;
    newState?: any;
    ip?: string;
    userAgent?: string;
    sessionId?: string;
    result: string;
  }): Promise<AuditEntryDocument> {
    const now = new Date();

    const auditEntry = new this.auditModel({
      ...entry,
      timestamp: now,
      dateComponents: {
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        hour: now.getHours(),
        minute: now.getMinutes(),
      },
    });

    return auditEntry.save();
  }

  async findAll(filters?: {
    userId?: string;
    module?: string;
    action?: string;
    year?: number;
    month?: number;
  }): Promise<AuditEntryDocument[]> {
    const query: any = {};

    if (filters?.userId) {
      query.userId = filters.userId;
    }

    if (filters?.module) {
      query.module = filters.module;
    }

    if (filters?.action) {
      query.action = filters.action;
    }

    if (filters?.year) {
      query['dateComponents.year'] = filters.year;
    }

    if (filters?.month) {
      query['dateComponents.month'] = filters.month;
    }

    return this.auditModel.find(query).sort({ timestamp: -1 }).exec();
  }

  async findByResource(resource: string): Promise<AuditEntryDocument[]> {
    return this.auditModel.find({ resource }).sort({ timestamp: -1 }).exec();
  }
}
