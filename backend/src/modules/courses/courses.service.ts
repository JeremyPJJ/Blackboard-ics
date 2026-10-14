import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument, CourseStatus } from './schemas/course.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { TrashService } from '../trash/trash.service';
import { TrashType } from '../trash/schemas/trash.schema';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    private readonly trashService: TrashService,
  ) {}

  async create(createCourseDto: CreateCourseDto, currentUser?: any): Promise<CourseDocument> {
    // Verificar si el código ya existe
    const existingCourse = await this.courseModel.findOne({ code: createCourseDto.code }).exec();
    if (existingCourse) {
      throw new ConflictException('El código de curso ya existe');
    }

    // Generar código de invitación
    const invitationCode = this.generateInvitationCode(createCourseDto.career);

    // Docente: agregarlo automáticamente como teacher del curso
    const teachers = [...(createCourseDto.teachers || [])];
    if (currentUser?.role === 'docente' && currentUser?._id) {
      const alreadyTeacher = teachers.some((t: any) =>
        t.userId?.toString() === currentUser._id.toString()
      );
      if (!alreadyTeacher) {
        teachers.push({
          userId: currentUser._id,
          role: 'teacher',
          enrolledAt: new Date(),
          addedBy: currentUser._id,
        } as any);
      }
    }

    const courseData = {
      ...createCourseDto,
      teachers,
      createdBy: currentUser?._id || null,
      invitationConfig: {
        code: invitationCode,
        isActive: true,
        currentUses: 0,
      },
    };

    const course = new this.courseModel(courseData);
    return course.save();
  }

  async findAll(filters?: { career?: string; status?: string; teacherId?: string; studentId?: string; search?: string; year?: string; semester?: string }): Promise<CourseDocument[]> {
    const query: any = {};

    // Archivados: solo se ven con filtro de estado 'archivado'
    if (filters?.status === 'archivado') {
      query.deletedAt = { $exists: true };
      query.status = 'archivado';
    } else {
      query.deletedAt = { $exists: false };
    }

    if (filters?.career) {
      query.career = filters.career;
    }

    if (filters?.status && filters.status !== 'archivado') {
      query.status = filters.status;
    }

    if (filters?.year) {
      query.year = Number(filters.year);
    }

    if (filters?.semester) {
      query.semester = Number(filters.semester);
    }

    if (filters?.teacherId) {
      // Castear a ObjectId si viene como hex string (los docs guardan ObjectId)
      query['teachers.userId'] = /^[0-9a-fA-F]{24}$/.test(filters.teacherId)
        ? new Types.ObjectId(filters.teacherId)
        : filters.teacherId;
    }

    if (filters?.studentId) {
      // Castear a ObjectId si viene como hex string (los docs guardan ObjectId)
      query['students.userId'] = /^[0-9a-fA-F]{24}$/.test(filters.studentId)
        ? new Types.ObjectId(filters.studentId)
        : filters.studentId;
    }

    if (filters?.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { career: searchRegex },
        { description: searchRegex },
      ];
    }

    return this.courseModel.find(query).exec();
  }

  async removePermanent(id: string): Promise<void> {
    const result = await this.courseModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Curso no encontrado');
    }
  }

  async restore(id: string): Promise<CourseDocument> {
    const result = await this.courseModel.updateOne(
      { _id: id },
      {
        $unset: { deletedAt: 1, deletedBy: 1, restoreUntil: 1 },
        $set: { status: 'activo' },
      },
    ).exec();

    if (result.modifiedCount === 0 && result.matchedCount === 0) {
      throw new NotFoundException('Curso no encontrado');
    }

    return this.courseModel.findById(id).exec() as Promise<CourseDocument>;
  }

  async findById(id: string): Promise<CourseDocument> {
    const course = await this.courseModel.findById(id).exec();
    if (!course || course.deletedAt) {
      throw new NotFoundException('Curso no encontrado');
    }
    return course;
  }

  async findByIdIncludingDeleted(id: string): Promise<CourseDocument> {
    const course = await this.courseModel.findById(id).exec();
    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }
    return course;
  }

  async findByInvitationCode(code: string): Promise<CourseDocument> {
    const course = await this.courseModel.findOne({
      'invitationConfig.code': code,
      'invitationConfig.isActive': true,
      deletedAt: { $exists: false },
    }).exec();

    if (!course) {
      throw new NotFoundException('Código de invitación inválido o expirado');
    }

    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<CourseDocument> {
    const course = await this.courseModel.findByIdAndUpdate(
      id,
      updateCourseDto,
      { new: true },
    ).exec();

    if (!course || course.deletedAt) {
      throw new NotFoundException('Curso no encontrado');
    }

    return course;
  }

  async remove(id: string, deletedBy: string): Promise<CourseDocument> {
    const course = await this.courseModel.findById(id).exec();
    if (!course || course.deletedAt) {
      throw new NotFoundException('Curso no encontrado');
    }

    // Snapshot completo en la papelera antes del soft-delete
    // (Spec: delete course → Trash entry of type COURSE with document snapshot).
    await this.trashService.moveToTrash(
      TrashType.COURSE,
      this.courseModel.collection.collectionName,
      course.toObject(),
      deletedBy,
      'Curso archivado',
    );

    // Soft delete sin validar subdocumentos (evita errores de datos legacy)
    const result = await this.courseModel.updateOne(
      { _id: id },
      {
        $set: {
          deletedAt: new Date(),
          deletedBy: deletedBy || undefined,
          restoreUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
          status: 'archivado',
        },
      },
    ).exec();

    if (result.modifiedCount === 0) {
      throw new NotFoundException('Curso no encontrado');
    }

    return this.courseModel.findById(id).exec() as Promise<CourseDocument>;
  }

  async joinByCode(code: string, userId: string): Promise<CourseDocument> {
    const course = await this.findByInvitationCode(code);

    // Verificar si el usuario ya está inscrito (defensivo ante userId faltantes)
    const isEnrolled = course.students.some(s => (s.userId?.toString?.() ?? '') === userId);
    if (isEnrolled) {
      throw new ConflictException('Ya estás inscrito en este curso');
    }

    // Inicializar invitationConfig si no existe (cursos legacy)
    if (!course.invitationConfig) {
      await this.courseModel.updateOne(
        { _id: course._id },
        { $set: { invitationConfig: { code, isActive: true, currentUses: 0 } } },
      ).exec();
    }

    // Verificar límites
    const config = course.invitationConfig;
    if (config?.maxUses && (config.currentUses || 0) >= config.maxUses) {
      throw new ConflictException('El código de invitación ha alcanzado el límite de usos');
    }

    // Agregar estudiante + incrementar usos SIN validar subdocumentos (updateOne)
    await this.courseModel.updateOne(
      { _id: course._id },
      {
        $push: { students: { userId: userId as any, role: 'student', enrolledAt: new Date() } },
        $inc: { 'invitationConfig.currentUses': 1 },
      },
    ).exec();

    return this.courseModel.findById(course._id).exec() as Promise<CourseDocument>;
  }

  async addParticipant(courseId: string, userId: string, role: 'teacher' | 'student', addedBy?: any): Promise<CourseDocument> {
    const course = await this.findById(courseId);

    // Evitar duplicados
    if (role === 'teacher' && course.teachers.some(t => t.userId?.toString() === userId)) {
      return course;
    }
    if (role === 'student' && course.students.some(s => s.userId?.toString() === userId)) {
      return course;
    }

    const enrollment = {
      userId: userId as any,
      role,
      enrolledAt: new Date(),
      addedBy: addedBy || null,
    };

    const field = role === 'teacher' ? 'teachers' : 'students';
    await this.courseModel.updateOne(
      { _id: courseId },
      { $push: { [field]: enrollment } },
    ).exec();

    return this.courseModel.findById(courseId).exec() as Promise<CourseDocument>;
  }

  async removeParticipant(courseId: string, userId: string, role: 'teacher' | 'student'): Promise<CourseDocument> {
    const course = await this.findById(courseId);

    if (role === 'teacher') {
      course.teachers = course.teachers.filter(t => (t.userId?.toString?.() ?? '') !== userId);
    } else {
      course.students = course.students.filter(s => (s.userId?.toString?.() ?? '') !== userId);
    }

    return course.save();
  }

  async updateStatus(id: string, status: CourseStatus): Promise<CourseDocument> {
    return this.courseModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    ).exec();
  }

  private generateInvitationCode(career: string): string {
    const careerPrefix = career.substring(0, 4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${careerPrefix}-${random}`;
  }
}
