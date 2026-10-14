import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StatsService } from './stats.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/decorators/permission.decorator';

@Controller('stats')
@UseGuards(AuthGuard('jwt'))
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  // Admin: resumen por docente
  @Get('teachers')
  @UseGuards(PermissionsGuard)
  @Permission('usuarios.ver')
  teacherSummary() {
    return this.statsService.teacherSummary();
  }

  // Detalle por docente (admin)
  @Get('teacher/:id')
  @UseGuards(PermissionsGuard)
  @Permission('usuarios.ver')
  teacherDetail(@Param('id') id: string) {
    return this.statsService.statsForTeacher(id);
  }

  // Cursos del docente con stats (admin, detalle)
  @Get('teacher/:id/courses')
  @UseGuards(PermissionsGuard)
  @Permission('usuarios.ver')
  teacherCourses(@Param('id') id: string) {
    return this.statsService.myCoursesStats(id);
  }

  // Docente: resumen de sus cursos (stats por curso)
  @Get('my-courses')
  async myCourses(@Request() req) {
    const teacherId = req.user._id.toString();
    const courses = await this.statsService.myCoursesStats(teacherId);
    return courses;
  }

  @Get('course/:id')
  courseStats(@Param('id') id: string) {
    return this.statsService.courseStats(id);
  }
}