import { Controller, Get, Post, Param, Body, Delete, UploadedFile, UseGuards, UseInterceptors, Request, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FilesService } from './files.service';

@Controller('files')
@UseGuards(AuthGuard('jwt'))
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('contextType') contextType: string,
    @Body('referenceId') referenceId: string,
    @Request() req,
  ) {
    return this.filesService.uploadFile(file, contextType, referenceId, req.user._id);
  }

  @Get(':id')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const file = await this.filesService.download(id);

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
    });

    res.send(file.buffer);
  }

  @Get('context/:contextType/:referenceId')
  async findByContext(
    @Param('contextType') contextType: string,
    @Param('referenceId') referenceId: string,
  ) {
    return this.filesService.findByContext(contextType, referenceId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.filesService.remove(id);
  }
}
