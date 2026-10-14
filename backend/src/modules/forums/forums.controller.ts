import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ForumsService } from './forums.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/decorators/permission.decorator';

@Controller('forums')
@UseGuards(AuthGuard('jwt'))
export class ForumsController {
  constructor(private readonly forumsService: ForumsService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permission('foros.crear')
  create(@Body() forumData: any) {
    return this.forumsService.create(forumData);
  }

  @Get('course/:courseId')
  findAllByCourse(@Param('courseId') courseId: string) {
    return this.forumsService.findAllByCourse(courseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.forumsService.findById(id);
  }

  @Post(':id/posts')
  @UseGuards(PermissionsGuard)
  @Permission('foros.post')
  addPost(@Param('id') id: string, @Body() postData: any, @Request() req) {
    return this.forumsService.addPost(id, { ...postData, authorId: req.user._id });
  }

  @Post(':id/posts/:postIndex/replies')
  @UseGuards(PermissionsGuard)
  @Permission('foros.post')
  addReply(
    @Param('id') id: string,
    @Param('postIndex') postIndex: number,
    @Body() replyData: any,
    @Request() req,
  ) {
    return this.forumsService.addReply(id, postIndex, { ...replyData, authorId: req.user._id });
  }

  @Post(':id/posts/:postIndex/replies/:replyIndex/replies')
  @UseGuards(PermissionsGuard)
  @Permission('foros.post')
  addReplyToReply(
    @Param('id') id: string,
    @Param('postIndex') postIndex: number,
    @Param('replyIndex') replyIndex: number,
    @Body() replyData: any,
    @Request() req,
  ) {
    return this.forumsService.addReplyToReply(id, postIndex, replyIndex, { ...replyData, authorId: req.user._id });
  }

  @Post(':id/posts/:postIndex/react')
  react(
    @Param('id') id: string,
    @Param('postIndex') postIndex: number,
    @Request() req,
  ) {
    return this.forumsService.react(id, postIndex, req.user._id.toString());
  }

  @Patch(':id/posts/:postIndex')
  updatePost(
    @Param('id') id: string,
    @Param('postIndex') postIndex: number,
    @Body('content') content: string,
  ) {
    return this.forumsService.updatePost(id, postIndex, content);
  }

  @Post(':id/lock')
  lockForum(@Param('id') id: string) {
    return this.forumsService.lockForum(id);
  }

  @Post(':id/unlock')
  unlockForum(@Param('id') id: string) {
    return this.forumsService.unlockForum(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.forumsService.update(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.forumsService.remove(id);
  }

  @Delete(':id/posts/:postIndex')
  removePost(
    @Param('id') id: string,
    @Param('postIndex') postIndex: number,
  ) {
    return this.forumsService.removePost(id, postIndex);
  }

  @Delete(':id/posts/:postIndex/replies/:replyIndex')
  removeReply(
    @Param('id') id: string,
    @Param('postIndex') postIndex: number,
    @Param('replyIndex') replyIndex: number,
  ) {
    return this.forumsService.removeReply(id, postIndex, replyIndex);
  }

  @Post(':id/evaluations')
  evaluateParticipant(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Body('score') score: number,
    @Body('feedback') feedback: string,
  ) {
    return this.forumsService.evaluateParticipant(id, userId, score, feedback);
  }

  @Get(':id/evaluations')
  getEvaluations(@Param('id') id: string) {
    return this.forumsService.getEvaluations(id);
  }
}
