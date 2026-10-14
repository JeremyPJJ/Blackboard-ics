import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseStatus } from './schemas/course.schema';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('courses')
@UseGuards(AuthGuard('jwt'))
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permission('cursos.crear')
  create(@Body() createCourseDto: CreateCourseDto, @Request() req) {
    return this.coursesService.create(createCourseDto, req.user);
  }

  @Get()
  findAll(
    @Query('career') career?: string,
    @Query('status') status?: string,
    @Query('teacherId') teacherId?: string,
    @Query('studentId') studentId?: string,
    @Query('search') search?: string,
    @Query('year') year?: string,
    @Query('semester') semester?: string,
    @Request() req?: any,
  ) {
    const role = req?.user?.role;

    // Docente: solo puede ver sus propios cursos
    if (role === 'docente') {
      teacherId = req.user._id.toString();
    }

    // Estudiante: solo puede ver cursos donde está inscrito
    if (role === 'estudiante') {
      studentId = req.user._id.toString();
    }

    return this.coursesService.findAll({ career, status, teacherId, studentId, search, year, semester });
  }

  @Get('join/:code')
  joinByCode(@Param('code') code: string, @Request() req) {
    return this.coursesService.joinByCode(code, req.user._id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req?: any) {
    const course = await this.coursesService.findById(id);
    this.assertCanView(course, req?.user);
    return course;
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permission('cursos.editar')
  async update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto, @Request() req?: any) {
    const course = await this.coursesService.findById(id);
    this.assertCanManage(course, req?.user);
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permission('cursos.archivar')
  async remove(@Param('id') id: string, @Request() req) {
    const course = await this.coursesService.findById(id);
    this.assertCanManage(course, req?.user);

    // Notificar a los estudiantes inscritos antes de archivar
    const studentIds = course.students.map((s: any) => s.userId?.toString()).filter(Boolean);
    await this.coursesService.remove(id, req.user._id);
    for (const studentId of studentIds) {
      await this.notificationsService.create({
        userId: studentId,
        type: 'course_archived',
        title: 'Curso archivado',
        message: `El curso "${course.name}" fue archivado por el docente.`,
        courseId: id,
      });
    }
    return course;
  }

  @Delete(':id/permanent')
  @UseGuards(PermissionsGuard)
  @Permission('cursos.eliminar')
  async removePermanent(@Param('id') id: string) {
    await this.coursesService.findByIdIncludingDeleted(id);
    await this.coursesService.removePermanent(id);
    return { message: 'Curso eliminado definitivamente' };
  }

  @Post(':id/restore')
  @UseGuards(PermissionsGuard)
  @Permission('cursos.editar')
  async restore(@Param('id') id: string) {
    await this.coursesService.findByIdIncludingDeleted(id);
    return this.coursesService.restore(id);
  }

  @Post(':id/participants')
  @UseGuards(PermissionsGuard)
  @Permission('cursos.editar')
  addParticipant(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Body('role') role: 'teacher' | 'student',
    @Request() req,
  ) {
    return this.coursesService.addParticipant(id, userId, role, req.user._id);
  }

  @Delete(':id/participants/:userId')
  removeParticipant(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Query('role') role: 'teacher' | 'student',
  ) {
    return this.coursesService.removeParticipant(id, userId, role);
  }

  @Patch(':id/status')
  @UseGuards(PermissionsGuard)
  @Permission('cursos.editar')
  updateStatus(@Param('id') id: string, @Body('status') status: CourseStatus) {
    return this.coursesService.updateStatus(id, status);
  }

  /** Docente → debe ser docente del curso. Estudiante → debe estar inscrito. */
  private assertCanView(course: any, user: any): void {
    if (!user) return;
    const userId = user._id?.toString?.() ?? user._id;

    if (user.role === 'docente') {
      const isTeacher = course.teachers?.some((t: any) => t.userId?.toString() === userId);
      if (!isTeacher) {
        throw new ForbiddenException('Solo puedes acceder a tus propios cursos');
      }
    }

    if (user.role === 'estudiante') {
      const isStudent = course.students?.some((s: any) => s.userId?.toString() === userId);
      if (!isStudent) {
        throw new ForbiddenException('No estás inscrito en este curso');
      }
    }
  }

  /** Docente → solo puede gestionar sus cursos. Estudiante → no gestiona. */
  private assertCanManage(course: any, user: any): void {
    if (!user) return;
    const userId = user._id?.toString?.() ?? user._id;

    if (user.role === 'estudiante') {
      throw new ForbiddenException('No tienes permisos para gestionar cursos');
    }

    if (user.role === 'docente') {
      const isTeacher = course.teachers?.some((t: any) => t.userId?.toString() === userId);
      if (!isTeacher) {
        throw new ForbiddenException('Solo puedes gestionar tus propios cursos');
      }
    }
  }
}
