import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AttendanceRegister, AttendanceRegisterDocument } from './schemas/attendance-register.schema';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(AttendanceRegister.name)
    private readonly attendanceModel: Model<AttendanceRegisterDocument>,
  ) {}

  async create(courseId: string): Promise<AttendanceRegisterDocument> {
    const register = new this.attendanceModel({ courseId });
    return register.save();
  }

  async findByCourse(courseId: string): Promise<AttendanceRegisterDocument> {
    const register = await this.attendanceModel.findOne({ courseId }).exec();
    if (!register) {
      throw new NotFoundException('Registro de asistencia no encontrado');
    }
    return register;
  }

  async findById(registerId: string): Promise<AttendanceRegisterDocument> {
    const register = await this.attendanceModel.findById(registerId).exec();
    if (!register) {
      throw new NotFoundException('Registro de asistencia no encontrado');
    }
    return register;
  }

  async addDate(
    registerId: string,
    date: Date,
    startTime: Date,
    endTime: Date,
    weekNumber: number,
    sessionNumber: number,
  ): Promise<AttendanceRegisterDocument> {
    const register = await this.attendanceModel.findById(registerId).exec();
    if (!register) {
      throw new NotFoundException('Registro de asistencia no encontrado');
    }

    register.dates.push({
      date,
      startTime,
      endTime,
      weekNumber,
      sessionNumber,
      records: [],
    });

    return register.save();
  }

  async markAttendance(
    registerId: string,
    dateIndex: number,
    studentId: string,
    status: string,
    reason?: string,
  ): Promise<AttendanceRegisterDocument> {
    const register = await this.attendanceModel.findById(registerId).exec();
    if (!register) {
      throw new NotFoundException('Registro de asistencia no encontrado');
    }

    if (dateIndex >= register.dates.length) {
      throw new NotFoundException('Fecha de asistencia no encontrada');
    }

    const dateRecord = register.dates[dateIndex];
    
    // Buscar si ya existe un registro para este estudiante
    const existingRecord = dateRecord.records.find(
      r => r.studentId.toString() === studentId,
    );

    if (existingRecord) {
      existingRecord.status = status as any;
      existingRecord.markedAt = new Date();
      if (reason) existingRecord.reason = reason;
    } else {
      dateRecord.records.push({
        studentId: studentId as any,
        status: status as any,
        markedAt: new Date(),
        modifiedBy: undefined,
        modifiedAt: undefined,
        reason: reason || '',
      } as any);
    }

    return register.save();
  }

  async modifyAttendance(
    registerId: string,
    dateIndex: number,
    studentId: string,
    status: string,
    modifiedBy: string,
    reason?: string,
  ): Promise<AttendanceRegisterDocument> {
    const register = await this.attendanceModel.findById(registerId).exec();
    if (!register) {
      throw new NotFoundException('Registro de asistencia no encontrado');
    }

    if (dateIndex >= register.dates.length) {
      throw new NotFoundException('Fecha de asistencia no encontrada');
    }

    const dateRecord = register.dates[dateIndex];
    const record = dateRecord.records.find(
      r => r.studentId.toString() === studentId,
    );

    if (!record) {
      throw new NotFoundException('Registro de estudiante no encontrado');
    }

    record.status = status as any;
    record.modifiedBy = modifiedBy as any;
    record.modifiedAt = new Date();
    if (reason) record.reason = reason;

    return register.save();
  }

  async getReport(courseId: string): Promise<any> {
    const register = await this.findByCourse(courseId);
    
    const report = register.dates.map(date => ({
      date: date.date,
      weekNumber: date.weekNumber,
      sessionNumber: date.sessionNumber,
      totalStudents: date.records.length,
      present: date.records.filter(r => r.status === 'presente').length,
      late: date.records.filter(r => r.status === 'tardanza').length,
      absent: date.records.filter(r => r.status === 'ausente').length,
    }));

    return report;
  }

  async getStudentSummary(studentId: string, courseIds: string[]): Promise<any> {
    // La BD tiene courseId mezclado: algunos ObjectId (seed) y otros string (app).
    // Consultar por ambos formatos para ser robusto.
    const registers = await this.attendanceModel.find({
      $or: [
        { courseId: { $in: courseIds } },
        { courseId: { $in: courseIds.map((id) => new Types.ObjectId(id)) } },
      ],
    }).lean().exec();

    const totals = { present: 0, absent: 0, late: 0, justified: 0 };
    const perCourse: Record<string, { present: number; absent: number; late: number; justified: number }> = {};

    registers.forEach((register: any) => {
      const key = register.courseId.toString();
      if (!perCourse[key]) perCourse[key] = { present: 0, absent: 0, late: 0, justified: 0 };

      (register.dates || []).forEach((date: any) => {
        (date.records || []).forEach((rec: any) => {
          if (rec.studentId?.toString() !== studentId) return;
          switch (rec.status) {
            case 'presente': totals.present++; perCourse[key].present++; break;
            case 'ausente': totals.absent++; perCourse[key].absent++; break;
            case 'tardanza': totals.late++; perCourse[key].late++; break;
            case 'justificado': totals.justified++; perCourse[key].justified++; break;
          }
        });
      });
    });

    return { totals, perCourse };
  }
}
