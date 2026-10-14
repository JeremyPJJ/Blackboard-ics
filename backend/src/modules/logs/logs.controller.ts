import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LogsService, LogEntry } from './logs.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/decorators/permission.decorator';

@Controller('logs')
@UseGuards(AuthGuard('jwt'))
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Post()
  async create(@Body() entry: LogEntry, @Request() req) {
    const result = await this.logsService.create({
      ...entry,
      userId: entry.userId || req.user?._id?.toString(),
    });
    return result || { ok: true };
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permission('usuarios.ver')
  findAll(
    @Query('level') level?: string,
    @Query('source') source?: string,
    @Query('limit') limit?: number,
  ) {
    return this.logsService.findAll({ level, source, limit: limit ? Number(limit) : undefined });
  }
}