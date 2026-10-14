import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { SetAttemptScoreDto } from './dto/set-attempt-score.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/decorators/permission.decorator';

@Controller('exams')
@UseGuards(AuthGuard('jwt'))
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  create(@Body() createExamDto: CreateExamDto) {
    return this.examsService.create(createExamDto);
  }

  @Get('course/:courseId')
  findAllByCourse(@Param('courseId') courseId: string) {
    return this.examsService.findAllByCourse(courseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExamDto: Partial<CreateExamDto>) {
    return this.examsService.update(id, updateExamDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.examsService.remove(id);
  }

  @Post(':id/start')
  startAttempt(@Param('id') id: string, @Request() req) {
    return this.examsService.startAttempt(id, req.user._id);
  }

  @Post(':id/submit')
  submitAttempt(
    @Param('id') id: string,
    @Body('answers') answers: Map<string, any>,
    @Request() req,
  ) {
    return this.examsService.submitAttempt(id, req.user._id, answers);
  }

  @Post(':id/supervision')
  addSupervisionEvent(
    @Param('id') id: string,
    @Body('eventType') eventType: string,
    @Body('details') details: string,
    @Request() req,
  ) {
    return this.examsService.addSupervisionEvent(id, req.user._id, eventType, details);
  }

  @Delete(':id/attempts/:studentId')
  removeAttempt(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.examsService.removeAttempt(id, studentId);
  }

  @Patch(':id/attempts/:studentId')
  @UseGuards(PermissionsGuard)
  @Permission('examenes.calificar')
  setAttemptScore(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Body() setAttemptScoreDto: SetAttemptScoreDto,
  ) {
    return this.examsService.setAttemptScore(id, studentId, setAttemptScoreDto.score);
  }
}
