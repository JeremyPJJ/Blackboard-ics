import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument, TaskStatus } from './schemas/task.schema';
import { TaskSubmission, TaskSubmissionDocument, SubmissionStatus } from './schemas/task-submission.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { SubmitTaskDto } from './dto/submit-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    @InjectModel(TaskSubmission.name) private readonly submissionModel: Model<TaskSubmissionDocument>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<TaskDocument> {
    const task = new this.taskModel(createTaskDto);
    return task.save();
  }

  async findAllByCourse(courseId: string): Promise<TaskDocument[]> {
    return this.taskModel.find({ courseId }).exec();
  }

  async findById(id: string): Promise<TaskDocument> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }
    return task;
  }

  async update(id: string, updateTaskDto: Partial<CreateTaskDto>): Promise<TaskDocument> {
    const task = await this.taskModel.findByIdAndUpdate(
      id,
      updateTaskDto,
      { new: true },
    ).exec();

    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    return task;
  }

  async remove(id: string): Promise<void> {
    const result = await this.taskModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Tarea no encontrada');
    }
  }

  async submit(submitTaskDto: SubmitTaskDto, studentId: string): Promise<TaskSubmissionDocument> {
    const task = await this.findById(submitTaskDto.taskId);

    // Verificar si ya entregó
    const existingSubmission = await this.submissionModel.findOne({
      taskId: submitTaskDto.taskId,
      studentId,
    }).exec();

    if (existingSubmission) {
      throw new ConflictException('Ya entregaste esta tarea');
    }

    // Verificar fecha límite
    let status = SubmissionStatus.ENTREGADO;
    if (task.deadline && new Date() > task.deadline) {
      status = SubmissionStatus.FUERA_DE_FECHA;
    }

    const submission = new this.submissionModel({
      taskId: submitTaskDto.taskId,
      courseId: task.courseId,
      studentId,
      fileIds: submitTaskDto.fileIds || [],
      comments: submitTaskDto.comments,
      status,
      lateReason: submitTaskDto.lateReason,
    });

    return submission.save();
  }

  async getSubmissionsByTask(taskId: string): Promise<TaskSubmissionDocument[]> {
    return this.submissionModel.find({ taskId }).exec();
  }

  async getSubmissionById(id: string): Promise<TaskSubmissionDocument> {
    const submission = await this.submissionModel.findById(id).exec();
    if (!submission) {
      throw new NotFoundException('Entrega no encontrada');
    }
    return submission;
  }

  async gradeSubmission(
    submissionId: string,
    score: number,
    feedback: string,
    gradedBy: string,
  ): Promise<TaskSubmissionDocument> {
    const submission = await this.getSubmissionById(submissionId);

    submission.score = score;
    submission.feedback = feedback;
    submission.gradedBy = gradedBy as any;
    submission.gradedAt = new Date();
    submission.status = SubmissionStatus.REVISADO;

    return submission.save();
  }

  async publishSubmission(submissionId: string): Promise<TaskSubmissionDocument> {
    const submission = await this.getSubmissionById(submissionId);
    submission.isPublished = true;
    return submission.save();
  }

  async removeSubmission(submissionId: string): Promise<void> {
    const result = await this.submissionModel.deleteOne({ _id: submissionId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Entrega no encontrada');
    }
  }
}
