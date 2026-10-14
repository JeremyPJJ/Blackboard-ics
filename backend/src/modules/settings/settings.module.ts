import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { InstitutionalSetting, InstitutionalSettingSchema } from './schemas/institutional-setting.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: InstitutionalSetting.name, schema: InstitutionalSettingSchema }])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
