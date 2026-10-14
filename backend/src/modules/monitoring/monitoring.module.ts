import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { Monitoring, MonitoringSchema } from './schemas/monitoring.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Monitoring.name, schema: MonitoringSchema }])],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
