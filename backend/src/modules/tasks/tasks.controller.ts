import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { SubmitTaskDto } from './dto/submit-task.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/decorators/permission.decorator';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permission('tareas.crear')
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get('course/:courseId')
  findAllByCourse(@Param('courseId') courseId: string) {
    return this.tasksService.findAllByCourse(courseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permission('tareas.editar')
  update(@Param('id') id: string, @Body() updateTaskDto: Partial<CreateTaskDto>) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permission('tareas.eliminar')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }

  @Post('submit')
  submit(@Body() submitTaskDto: SubmitTaskDto, @Request() req) {
    return this.tasksService.submit(submitTaskDto, req.user._id);
  }

  @Get(':id/submissions')
  getSubmissions(@Param('id') id: string) {
    return this.tasksService.getSubmissionsByTask(id);
  }

  @Post(':id/grade')
  @UseGuards(PermissionsGuard)
  @Permission('tareas.calificar')
  gradeSubmission(
    @Param('id') id: string,
    @Body('submissionId') submissionId: string,
    @Body('score') score: number,
    @Body('feedback') feedback: string,
    @Request() req,
  ) {
    return this.tasksService.gradeSubmission(submissionId, score, feedback, req.user._id);
  }

  @Post(':id/publish')
  publishSubmission(@Param('id') id: string, @Body('submissionId') submissionId: string) {
    return this.tasksService.publishSubmission(submissionId);
  }

  @Delete('submissions/:submissionId')
  removeSubmission(@Param('submissionId') submissionId: string) {
    return this.tasksService.removeSubmission(submissionId);
  }
}
