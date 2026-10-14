import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AttendanceService } from './attendance.service';
import { CoursesService } from '../courses/courses.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/decorators/permission.decorator';

@Controller('attendance')
@UseGuards(AuthGuard('jwt'))
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly coursesService: CoursesService,
  ) {}

  @Post('course/:courseId')
  @UseGuards(PermissionsGuard)
  @Permission('asistencia.registrar')
  async create(@Param('courseId') courseId: string, @Request() req) {
    await this.assertTeacherOfCourse(courseId, req.user);
    return this.attendanceService.create(courseId);
  }

  @Get('course/:courseId')
  async findByCourse(@Param('courseId') courseId: string, @Request() req) {
    // Docente: solo puede ver asistencia de sus propios cursos
    if (req.user.role === 'docente') {
      await this.assertTeacherOfCourse(courseId, req.user);
    }
    return this.attendanceService.findByCourse(courseId);
  }

  @Post(':registerId/dates')
  addDate(
    @Param('registerId') registerId: string,
    @Body('date') date: Date,
    @Body('startTime') startTime: Date,
    @Body('endTime') endTime: Date,
    @Body('weekNumber') weekNumber: number,
    @Body('sessionNumber') sessionNumber: number,
  ) {
    return this.attendanceService.addDate(
      registerId,
      date,
      startTime,
      endTime,
      weekNumber,
      sessionNumber,
    );
  }

  @Post('mark')
  @UseGuards(PermissionsGuard)
  @Permission('asistencia.registrar')
  markAttendance(@Body() markAttendanceDto: MarkAttendanceDto, @Request() req) {
    if (req.user.role === 'estudiante') {
      throw new ForbiddenException('No tienes permisos para marcar asistencia');
    }
    return this.attendanceService.markAttendance(
      markAttendanceDto.registerId,
      markAttendanceDto.dateIndex,
      markAttendanceDto.studentId,
      markAttendanceDto.status,
      markAttendanceDto.reason,
    );
  }

  @Post('modify')
  @UseGuards(PermissionsGuard)
  @Permission('asistencia.modificar')
  async modifyAttendance(
    @Body('registerId') registerId: string,
    @Body('dateIndex') dateIndex: number,
    @Body('studentId') studentId: string,
    @Body('status') status: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    if (req.user.role === 'estudiante') {
      throw new ForbiddenException('No tienes permisos para modificar asistencia');
    }

    // Docente: solo puede modificar asistencia de sus cursos
    if (req.user.role === 'docente') {
      const register = await this.attendanceService.findById(registerId);
      await this.assertTeacherOfCourse(register.courseId.toString(), req.user);
    }

    return this.attendanceService.modifyAttendance(
      registerId,
      dateIndex,
      studentId,
      status,
      req.user._id,
      reason,
    );
  }

  @Get('report/:courseId')
  getReport(@Param('courseId') courseId: string) {
    return this.attendanceService.getReport(courseId);
  }

  @Get('student/:studentId/summary')
  getStudentSummary(
    @Param('studentId') studentId: string,
    @Query('courseIds') courseIds: string,
  ) {
    const ids = courseIds ? courseIds.split(',').filter(Boolean) : [];
    return this.attendanceService.getStudentSummary(studentId, ids);
  }

  private async assertTeacherOfCourse(courseId: string, user: any): Promise<void> {
    if (!user || user.role !== 'docente') return; // admin/unidad_academica pueden siempre

    const course = await this.coursesService.findById(courseId);
    const userId = user._id?.toString?.() ?? user._id;
    const isTeacher = course.teachers?.some((t: any) => t.userId?.toString() === userId);

    if (!isTeacher) {
      throw new ForbiddenException('Solo puedes gestionar la asistencia de tus propios cursos');
    }
  }
}