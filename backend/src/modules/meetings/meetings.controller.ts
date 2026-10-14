import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { MeetingsService } from './meetings.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/decorators/permission.decorator';

/**
 * Reuniones (Spec: Meetings).
 *
 * Las mutaciones quedan protegidas con `PermissionsGuard` bajo el namespace
 * `reuniones.*` (patrón `ofertas.*`): crear, editar, eliminar y gestionar
 * participantes. Los GET se mantienen solo autenticados (cualquier miembro
 * puede ver la lista de reuniones de su curso).
 */
@Controller('meetings')
@UseGuards(AuthGuard('jwt'))
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permission('reuniones.crear')
  create(@Body() meetingData: any) {
    return this.meetingsService.create(meetingData);
  }

  @Get('course/:courseId')
  findAllByCourse(@Param('courseId') courseId: string) {
    return this.meetingsService.findAllByCourse(courseId);
  }

  // Sala fija por curso (Spec: Meetings — check-in/out automáticos)

  @Post('course/:courseId/join')
  joinCourseRoom(
    @Param('courseId') courseId: string,
    @Body() body: { title?: string },
    @Req() req: Request,
  ) {
    const userId = (req.user as any)._id?.toString();
    return this.meetingsService.joinCourseRoom(courseId, userId, body?.title);
  }

  @Patch('session/:id/leave')
  leaveCourseRoom(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any)._id?.toString();
    return this.meetingsService.leaveCourseRoom(id, userId);
  }

  @Get('course/:courseId/sessions')
  getOpenSessions(@Param('courseId') courseId: string, @Req() req: Request) {
    const userId = (req.user as any)._id?.toString();
    return this.meetingsService.getOpenSessionsByCourse(courseId, userId);
  }

  // Historial de sesiones cerradas (Spec: Meetings O5). Declarada ANTES de
  // @Get(':id') para que /sessions/history no colisione con la ruta de id.
  @Get('course/:courseId/sessions/history')
  getSessionsHistory(@Param('courseId') courseId: string, @Req() req: Request) {
    const userId = (req.user as any)._id?.toString();
    return this.meetingsService.getClosedSessionsByCourse(courseId, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meetingsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permission('reuniones.editar')
  update(@Param('id') id: string, @Body() meetingData: any) {
    return this.meetingsService.update(id, meetingData);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permission('reuniones.eliminar')
  remove(@Param('id') id: string) {
    return this.meetingsService.remove(id);
  }

  @Post(':id/participants/:userId')
  @UseGuards(PermissionsGuard)
  @Permission('reuniones.editar')
  addParticipant(@Param('id') id: string, @Param('userId') userId: string) {
    return this.meetingsService.addParticipant(id, userId);
  }

  @Delete(':id/participants/:userId')
  @UseGuards(PermissionsGuard)
  @Permission('reuniones.editar')
  removeParticipant(@Param('id') id: string, @Param('userId') userId: string) {
    return this.meetingsService.removeParticipant(id, userId);
  }
}
