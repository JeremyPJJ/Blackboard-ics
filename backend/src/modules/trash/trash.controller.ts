import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TrashService } from './trash.service';
import { TrashType } from './schemas/trash.schema';

@Controller('trash')
@UseGuards(AuthGuard('jwt'))
export class TrashController {
  constructor(private readonly trashService: TrashService) {}

  @Post()
  moveToTrash(
    @Body('type') type: TrashType,
    @Body('originalCollection') originalCollection: string,
    @Body('document') document: any,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.trashService.moveToTrash(type, originalCollection, document, req.user._id, reason);
  }

  @Get()
  findAll(@Request() req) {
    return this.trashService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trashService.findById(id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string, @Request() req) {
    return this.trashService.restore(id, req.user._id);
  }

  @Delete(':id')
  permanentlyDelete(@Param('id') id: string) {
    return this.trashService.permanentlyDelete(id);
  }

  @Post('clean')
  cleanExpiredTrash() {
    return this.trashService.cleanExpiredTrash();
  }
}
