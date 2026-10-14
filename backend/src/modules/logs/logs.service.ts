import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log, LogDocument } from './schemas/log.schema';

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  source: 'backend' | 'frontend';
  message: string;
  meta?: any;
  userId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
}

@Injectable()
export class LogsService {
  constructor(
    @InjectModel(Log.name) private readonly logModel: Model<LogDocument>,
  ) {}

  async create(entry: LogEntry): Promise<LogDocument> {
    try {
      const log = new this.logModel(entry);
      return await log.save();
    } catch (error) {
      console.error('Error guardando log:', error?.message);
      return null;
    }
  }

  async findAll(filters?: { level?: string; source?: string; limit?: number }): Promise<LogDocument[]> {
    const query: any = {};
    if (filters?.level) query.level = filters.level;
    if (filters?.source) query.source = filters.source;
    const limit = Math.min(filters?.limit || 100, 500);
    return this.logModel.find(query).sort({ createdAt: -1 }).limit(limit).exec();
  }
}