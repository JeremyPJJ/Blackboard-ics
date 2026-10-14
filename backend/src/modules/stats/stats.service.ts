import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { AttendanceRegister, AttendanceRegisterDocument } from '../attendance/schemas/attendance-register.schema';
import { Forum, ForumDocument } from '../forums/schemas/forum.schema';
import { Exam, ExamDocument } from '../exams/schemas/exam.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    @InjectModel(AttendanceRegister.name) private readonly attendanceModel: Model<AttendanceRegisterDocument>,
    @InjectModel(Forum.name) private readonly forumModel: Model<ForumDocument>,
    @InjectModel(Exam.name) private readonly examModel: Model<ExamDocument>,
    private readonly usersService: UsersService,
  ) {}

  async teacherSummary(): Promise<any[]> {
    const teachers = await this.usersService.findAll({ role: 'docente' });

    const summaries = [];
    for (const teacher of teachers) {
      summaries.push(await this.statsForTeacher(teacher._id.toString()));
    }
    return summaries;
  }

  async statsForTeacher(teacherId: string): Promise<any> {
    const teacher = await this.usersService.findById(teacherId);

    const courses = await this.courseModel.find({
      'teachers.userId': this.toObjectId(teacherId),
      deletedAt: { $exists: false },
    }).exec();

    const courseIds = courses.map(c => c._id.toString());

    const sessionCount = courses.reduce(
      (acc, c) => acc + (c.weeks || []).reduce((s, w) => s + (w.sessions?.length || 0), 0),
      0,
    );
    const materialCount = courses.reduce(
      (acc, c) => acc + (c.weeks || []).reduce(
        (s, w) => s + (w.sessions || []).reduce((m, ses) => m + (ses.materials?.length || 0), 0),
        0,
      ),
      0,
    );
    const taskCount = courseIds.length
      ? await this.taskModel.countDocuments({ courseId: { $in: courseIds } }).exec()
      : 0;
    const attendanceCount = courseIds.length
      ? await this.attendanceModel.countDocuments({ courseId: { $in: courseIds } }).exec()
      : 0;
    const forumCount = courseIds.length
      ? await this.forumModel.countDocuments({ courseId: { $in: courseIds } }).exec()
      : 0;
    const examCount = courseIds.length
      ? await this.examModel.countDocuments({ courseId: { $in: courseIds } }).exec()
      : 0;

    return {
      teacherId,
      name: `${teacher.names} ${teacher.lastNames || ''}`.trim(),
      email: teacher.institutionalEmail,
      courseCount: courses.length,
      sessionCount,
      materialCount,
      taskCount,
      attendanceCount,
      forumCount,
      examCount,
    };
  }

  async myCoursesStats(teacherId: string): Promise<any[]> {
    const courses = await this.courseModel.find({
      'teachers.userId': this.toObjectId(teacherId),
      deletedAt: { $exists: false },
    }).exec();

    const result = [];
    for (const course of courses) {
      result.push(await this.courseStats(course._id.toString()));
    }
    return result;
  }

  async courseStats(courseId: string): Promise<any> {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) return null;

    const sessionCount = (course.weeks || []).reduce(
      (s, w) => s + (w.sessions?.length || 0),
      0,
    );
    const materialCount = (course.weeks || []).reduce(
      (s, w) => s + (w.sessions || []).reduce((m, ses) => m + (ses.materials?.length || 0), 0),
      0,
    );
    const taskCount = await this.taskModel.countDocuments({ courseId }).exec();
    const attendanceCount = await this.attendanceModel.countDocuments({ courseId }).exec();
    const forumCount = await this.forumModel.countDocuments({ courseId }).exec();
    const examCount = await this.examModel.countDocuments({ courseId }).exec();

    return {
      courseId,
      name: course.name,
      code: course.code,
      status: course.status,
      invitationCode: course.invitationConfig?.code || '',
      sessionCount,
      materialCount,
      taskCount,
      attendanceCount,
      forumCount,
      examCount,
      studentCount: course.students?.length || 0,
    };
  }

  /** Castea un hex string a ObjectId (los enrollments guardan ObjectId). */
  private toObjectId(id: string): Types.ObjectId | string {
    return /^[0-9a-fA-F]{24}$/.test(id) ? new Types.ObjectId(id) : id;
  }
}