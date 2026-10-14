import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findMine(@Request() req, @Param('unread') unread?: string) {
    return this.notificationsService.findByUser(req.user._id.toString(), unread === 'true');
  }

  @Post(':id/read')
  markRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markRead(id, req.user._id.toString());
  }

  @Post('read-all')
  markAllRead(@Request() req) {
    return this.notificationsService.markAllRead(req.user._id.toString());
  }
}