import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, JobDocument, ApplicationStatus } from './schemas/job.schema';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
  ) {}

  async create(jobData: any): Promise<JobDocument> {
    const job = new this.jobModel(jobData);
    return job.save();
  }

  async findAll(filters?: { career?: string; status?: string }): Promise<JobDocument[]> {
    const query: any = {};
    if (filters?.career) query.career = filters.career;
    if (filters?.status) query.status = filters.status;
    return this.jobModel.find(query).exec();
  }

  async findById(id: string): Promise<JobDocument> {
    const job = await this.jobModel.findById(id).exec();
    if (!job) {
      throw new NotFoundException('Oferta laboral no encontrada');
    }
    return job;
  }

  async update(id: string, jobData: any): Promise<JobDocument> {
    const job = await this.jobModel.findByIdAndUpdate(id, jobData, { new: true }).exec();
    if (!job) {
      throw new NotFoundException('Oferta laboral no encontrada');
    }
    return job;
  }

  async remove(id: string): Promise<void> {
    const result = await this.jobModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Oferta laboral no encontrada');
    }
  }

  async apply(jobId: string, studentId: string, applicationData: any): Promise<JobDocument> {
    const job = await this.findById(jobId);
    
    const existingApplication = job.applications.find(
      a => a.studentId.toString() === studentId,
    );
    
    if (existingApplication) {
      throw new NotFoundException('Ya postulaste a esta oferta');
    }

    job.applications.push({
      ...applicationData,
      studentId: studentId as any,
      appliedAt: new Date(),
      status: ApplicationStatus.POSTULADO,
    });

    return job.save();
  }

  async updateApplicationStatus(
    jobId: string,
    applicationIndex: number,
    status: ApplicationStatus,
  ): Promise<JobDocument> {
    const job = await this.findById(jobId);
    
    if (applicationIndex >= job.applications.length) {
      throw new NotFoundException('Postulación no encontrada');
    }

    job.applications[applicationIndex].status = status;
    job.applications[applicationIndex].reviewedAt = new Date();

    return job.save();
  }
}
