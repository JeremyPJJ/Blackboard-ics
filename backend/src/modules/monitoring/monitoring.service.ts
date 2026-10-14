import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Monitoring, MonitoringDocument } from './schemas/monitoring.schema';

@Injectable()
export class MonitoringService {
  constructor(
    @InjectModel(Monitoring.name) private readonly monitoringModel: Model<MonitoringDocument>,
  ) {}

  async getMonitoringByCourse(courseId: string): Promise<MonitoringDocument> {
    const monitoring = await this.monitoringModel.findOne({ courseId }).exec();
    if (!monitoring) {
      throw new NotFoundException('Monitoreo no encontrado para este curso');
    }
    return monitoring;
  }

  async updateTeacherProgress(
    courseId: string,
    teacherId: string,
    progressData: any,
  ): Promise<MonitoringDocument> {
    let monitoring = await this.monitoringModel.findOne({ courseId }).exec();
    
    if (!monitoring) {
      monitoring = new this.monitoringModel({ courseId });
    }

    const teacherProgress = monitoring.teacherProgress.find(
      tp => tp.teacherId.toString() === teacherId,
    );

    if (teacherProgress) {
      Object.assign(teacherProgress, progressData);
    } else {
      monitoring.teacherProgress.push({
        ...progressData,
        teacherId: teacherId as any,
        courseId: courseId as any,
      });
    }

    monitoring.lastUpdated = new Date();
    return monitoring.save();
  }

  async updateStudentProgress(
    courseId: string,
    studentId: string,
    progressData: any,
  ): Promise<MonitoringDocument> {
    let monitoring = await this.monitoringModel.findOne({ courseId }).exec();
    
    if (!monitoring) {
      monitoring = new this.monitoringModel({ courseId });
    }

    const studentProgress = monitoring.studentProgress.find(
      sp => sp.studentId.toString() === studentId,
    );

    if (studentProgress) {
      Object.assign(studentProgress, progressData);
    } else {
      monitoring.studentProgress.push({
        ...progressData,
        studentId: studentId as any,
        courseId: courseId as any,
      });
    }

    monitoring.lastUpdated = new Date();
    return monitoring.save();
  }

  async getTeacherProgress(courseId: string, teacherId: string): Promise<any> {
    const monitoring = await this.getMonitoringByCourse(courseId);
    return monitoring.teacherProgress.find(tp => tp.teacherId.toString() === teacherId);
  }

  async getStudentProgress(courseId: string, studentId: string): Promise<any> {
    const monitoring = await this.getMonitoringByCourse(courseId);
    return monitoring.studentProgress.find(sp => sp.studentId.toString() === studentId);
  }
}
