import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MonitoringService } from './monitoring.service';

@Controller('monitoring')
@UseGuards(AuthGuard('jwt'))
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('course/:courseId')
  getMonitoringByCourse(@Param('courseId') courseId: string) {
    return this.monitoringService.getMonitoringByCourse(courseId);
  }

  @Post('course/:courseId/teacher/:teacherId')
  updateTeacherProgress(
    @Param('courseId') courseId: string,
    @Param('teacherId') teacherId: string,
    @Body() progressData: any,
  ) {
    return this.monitoringService.updateTeacherProgress(courseId, teacherId, progressData);
  }

  @Post('course/:courseId/student/:studentId')
  updateStudentProgress(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @Body() progressData: any,
  ) {
    return this.monitoringService.updateStudentProgress(courseId, studentId, progressData);
  }

  @Get('course/:courseId/teacher/:teacherId')
  getTeacherProgress(
    @Param('courseId') courseId: string,
    @Param('teacherId') teacherId: string,
  ) {
    return this.monitoringService.getTeacherProgress(courseId, teacherId);
  }

  @Get('course/:courseId/student/:studentId')
  getStudentProgress(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.monitoringService.getStudentProgress(courseId, studentId);
  }
}
