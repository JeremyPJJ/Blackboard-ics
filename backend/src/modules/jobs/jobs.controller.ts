import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JobsService } from './jobs.service';
import { ApplicationStatus } from './schemas/job.schema';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/decorators/permission.decorator';

/**
 * Ofertas laborales (Spec: Job Offers).
 *
 * Todos los endpoints quedan protegidos con `PermissionsGuard` bajo el
 * namespace `ofertas.*` (diseño: claves crear, editar, eliminar, revisar,
 * ver, postular). El guard sigue la convención del repo: super_admin pasa
 * siempre, los usuarios con lista explícita de permisos son exigidos, y los
 * usuarios sin permisos explícitos pasan (la validación por rol existe aparte).
 */
@Controller('jobs')
@UseGuards(AuthGuard('jwt'))
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permission('ofertas.crear')
  create(@Body() jobData: any, @Request() req) {
    return this.jobsService.create({ ...jobData, createdBy: req.user._id });
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permission('ofertas.ver')
  findAll(@Request() req) {
    return this.jobsService.findAll();
  }

  @Get('career/:career')
  @UseGuards(PermissionsGuard)
  @Permission('ofertas.ver')
  findAllByCareer(@Param('career') career: string) {
    return this.jobsService.findAll({ career });
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permission('ofertas.ver')
  findOne(@Param('id') id: string) {
    return this.jobsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permission('ofertas.editar')
  update(@Param('id') id: string, @Body() jobData: any) {
    return this.jobsService.update(id, jobData);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permission('ofertas.eliminar')
  remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }

  @Post(':id/apply')
  @UseGuards(PermissionsGuard)
  @Permission('ofertas.postular')
  apply(@Param('id') id: string, @Body() applicationData: any, @Request() req) {
    return this.jobsService.apply(id, req.user._id, applicationData);
  }

  @Patch(':id/applications/:applicationIndex/status')
  @UseGuards(PermissionsGuard)
  @Permission('ofertas.revisar')
  updateApplicationStatus(
    @Param('id') id: string,
    @Param('applicationIndex') applicationIndex: number,
    @Body('status') status: ApplicationStatus,
  ) {
    return this.jobsService.updateApplicationStatus(id, applicationIndex, status);
  }
}
