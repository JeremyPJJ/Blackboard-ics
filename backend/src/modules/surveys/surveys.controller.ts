import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SurveysService } from './surveys.service';

@Controller('surveys')
@UseGuards(AuthGuard('jwt'))
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Post()
  create(@Body() surveyData: any, @Request() req) {
    return this.surveysService.create({ ...surveyData, createdBy: req.user._id });
  }

  @Get()
  findAll(
    @Query('courseId') courseId?: string,
    @Query('targetRole') targetRole?: string,
    @Query('creatorId') creatorId?: string,
  ) {
    return this.surveysService.findAll({ courseId, targetRole, creatorId });
  }

  @Get('course/:courseId')
  findAllByCourse(@Param('courseId') courseId: string) {
    return this.surveysService.findAll({ courseId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.surveysService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() surveyData: any) {
    return this.surveysService.update(id, surveyData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.surveysService.remove(id);
  }

  @Post(':id/responses')
  submitResponse(@Param('id') id: string, @Body() response: any, @Request() req) {
    return this.surveysService.submitResponse(id, {
      ...response,
      userId: req.user._id,
    }, req.user);
  }

  @Get(':id/statistics')
  getStatistics(@Param('id') id: string) {
    return this.surveysService.getStatistics(id);
  }

  @Get(':id/responses')
  getResponses(@Param('id') id: string) {
    return this.surveysService.getResponses(id);
  }
}
