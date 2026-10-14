import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Meeting, MeetingDocument } from './schemas/meeting.schema';
import { MeetingSession, MeetingSessionDocument } from './schemas/meeting-session.schema';
import { Course, CourseDocument } from '@modules/courses/schemas/course.schema';
import { User, UserDocument } from '@modules/users/schemas/user.schema';
import { calculateDurationMinutes, buildClosedSessionsFilter } from './meeting-session.utils';
import { canEnterRoom } from './meeting-access.utils';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectModel(Meeting.name) private readonly meetingModel: Model<MeetingDocument>,
    @InjectModel(MeetingSession.name) private readonly sessionModel: Model<MeetingSessionDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(meetingData: any): Promise<MeetingDocument> {
    const meeting = new this.meetingModel(meetingData);
    return meeting.save();
  }

  async findAllByCourse(courseId: string): Promise<MeetingDocument[]> {
    return this.meetingModel.find({ courseId }).exec();
  }

  async findById(id: string): Promise<MeetingDocument> {
    const meeting = await this.meetingModel.findById(id).exec();
    if (!meeting) {
      throw new NotFoundException('Reunión no encontrada');
    }
    return meeting;
  }

  async update(id: string, meetingData: any): Promise<MeetingDocument> {
    const meeting = await this.meetingModel.findByIdAndUpdate(id, meetingData, { new: true }).exec();
    if (!meeting) {
      throw new NotFoundException('Reunión no encontrada');
    }
    return meeting;
  }

  async remove(id: string): Promise<void> {
    const result = await this.meetingModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Reunión no encontrada');
    }
  }

  async addParticipant(meetingId: string, userId: string): Promise<MeetingDocument> {
    const meeting = await this.findById(meetingId);
    if (!meeting.participants.some(p => p.toString() === userId)) {
      meeting.participants.push(userId as any);
    }
    return meeting.save();
  }

  async removeParticipant(meetingId: string, userId: string): Promise<MeetingDocument> {
    const meeting = await this.findById(meetingId);
    meeting.participants = meeting.participants.filter(
      p => p.toString() !== userId,
    );
    return meeting.save();
  }

  // ─── Sala de reuniones por curso (Spec: Meetings) ─────────────────────────

  /**
   * Control de acceso a la sala (Spec N4 — acceso ampliado).
   * Entran a cualquier sala: super_admin o usuarios con permiso `reuniones.*`
   * en `user.permissions` (mismo criterio que PermissionsGuard). En otro caso
   * solo docentes del curso o estudiantes inscritos (403 en otro caso,
   * comportamiento previo preservado). `getOpenSessionsByCourse` y
   * `getClosedSessionsByCourse` reusan esta regla vía assert.
   */
  async assertCanEnterRoom(courseId: string, userId: string): Promise<CourseDocument> {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course || course.deletedAt) {
      throw new NotFoundException('Curso no encontrado');
    }
    const uid = String(userId);
    const isTeacher = course.teachers.some((t) => String(t.userId) === uid);
    const isStudent = course.students.some((s) => String(s.userId) === uid);
    const user = await this.userModel.findById(uid).select('role permissions').exec();
    if (!canEnterRoom({ role: user?.role, permissions: user?.permissions, isTeacher, isStudent })) {
      throw new ForbiddenException(
        'No tienes acceso a la sala de reuniones de este curso',
      );
    }
    return course;
  }

  /**
   * Check-in automático: crea la sesión con `checkInAt` o reutiliza la sesión
   * abierta existente del mismo usuario en el curso (Spec: idempotent join).
   *
   * Spec F2 — título set-on-create: `title` SOLO se fija al CREAR una sesión
   * nueva (primer entrante, con default 'Reunión'). Al reutilizar una sesión
   * abierta existente el título NUNCA se sobrescribe (ni aquí ni en el catch
   * de carrera 11000), preservando el título del primer entrante.
   */
  async joinCourseRoom(
    courseId: string,
    userId: string,
    title?: string,
  ): Promise<MeetingSessionDocument> {
    await this.assertCanEnterRoom(courseId, userId);

    const existing = await this.sessionModel
      .findOne({ courseId, userId, checkOutAt: null })
      .exec();
    if (existing) {
      return existing;
    }

    try {
      const session = new this.sessionModel({
        courseId,
        userId,
        checkInAt: new Date(),
        title: title?.trim() ? title.trim() : 'Reunión',
      });
      return await session.save();
    } catch (error: any) {
      // Carrera de doble join: el índice parcial único (courseId, userId) con
      // checkOutAt null rechaza el segundo insert; se reutiliza la existente.
      if (error?.code === 11000) {
        const raced = await this.sessionModel
          .findOne({ courseId, userId, checkOutAt: null })
          .exec();
        if (raced) {
          return raced;
        }
      }
      throw error;
    }
  }

  /**
   * Check-out automático: fija `checkOutAt` y calcula `durationMinutes` como la
   * diferencia desde `checkInAt`. Idempotente: una sesión ya cerrada no se toca.
   */
  async leaveCourseRoom(sessionId: string, userId: string): Promise<MeetingSessionDocument> {
    const session = await this.sessionModel.findById(sessionId).exec();
    if (!session) {
      throw new NotFoundException('Sesión de reunión no encontrada');
    }
    if (String(session.userId) !== String(userId)) {
      throw new ForbiddenException('No puedes cerrar una sesión ajena');
    }
    if (session.checkOutAt) {
      return session;
    }
    session.checkOutAt = new Date();
    session.durationMinutes = calculateDurationMinutes(session.checkInAt, session.checkOutAt);
    return session.save();
  }

  /**
   * Lista de participantes actuales de la sala (sesiones abiertas), enriquecida
   * con el nombre legible para la UI. Acceso restringido igual que la sala.
   */
  async getOpenSessionsByCourse(courseId: string, userId: string): Promise<any[]> {
    await this.assertCanEnterRoom(courseId, userId);

    const sessions = await this.sessionModel
      .find({ courseId, checkOutAt: null })
      .sort({ checkInAt: 1 })
      .exec();

    const userIds = sessions.map((s) => String(s.userId));
    const users = userIds.length
      ? await this.userModel.find({ _id: { $in: userIds } }).select('names lastNames role').exec()
      : [];
    const names: Record<string, string> = {};
    for (const user of users) {
      names[String(user._id)] = `${user.lastNames}, ${user.names}`.trim();
    }

    return sessions.map((s) => ({
      _id: s._id,
      userId: String(s.userId),
      checkInAt: s.checkInAt,
      title: s.title ?? null,
      displayName: names[String(s.userId)] ?? 'Usuario',
    }));
  }

  /**
   * Historial de sesiones cerradas del curso (Spec: Meetings O5 — historial).
   * Espejo de `getOpenSessionsByCourse` pero con `checkOutAt != null`, orden
   * descendente por `checkInAt` y enriquecido además con `checkOutAt` y
   * `durationMinutes` para la tabla de resumen de reuniones.
   */
  async getClosedSessionsByCourse(courseId: string, userId: string): Promise<any[]> {
    await this.assertCanEnterRoom(courseId, userId);

    const sessions = await this.sessionModel
      .find(buildClosedSessionsFilter(courseId))
      .sort({ checkInAt: -1 })
      .exec();

    const userIds = sessions.map((s) => String(s.userId));
    const users = userIds.length
      ? await this.userModel.find({ _id: { $in: userIds } }).select('names lastNames role').exec()
      : [];
    const names: Record<string, string> = {};
    for (const user of users) {
      names[String(user._id)] = `${user.lastNames}, ${user.names}`.trim();
    }

    return sessions.map((s) => ({
      _id: s._id,
      userId: String(s.userId),
      checkInAt: s.checkInAt,
      checkOutAt: s.checkOutAt,
      durationMinutes: s.durationMinutes,
      title: s.title ?? null,
      displayName: names[String(s.userId)] ?? 'Usuario',
    }));
  }
}
