import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(AuthGuard('jwt'))
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    return this.auditService.findAll({ userId, module, action, year, month });
  }

  @Get('resource/:resource')
  findByResource(@Param('resource') resource: string) {
    return this.auditService.findByResource(resource);
  }
}
