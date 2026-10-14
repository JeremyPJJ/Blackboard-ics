import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InstitutionalSetting, InstitutionalSettingDocument } from './schemas/institutional-setting.schema';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(InstitutionalSetting.name)
    private readonly settingModel: Model<InstitutionalSettingDocument>,
  ) {}

  async getSettings(): Promise<InstitutionalSettingDocument> {
    const settings = await this.settingModel.findOne().exec();
    if (!settings) {
      throw new NotFoundException('Configuración institucional no encontrada');
    }
    return settings;
  }

  async updateSettings(updateDto: Partial<InstitutionalSetting>): Promise<InstitutionalSettingDocument> {
    const settings = await this.settingModel.findOne().exec();
    if (!settings) {
      throw new NotFoundException('Configuración institucional no encontrada');
    }

    Object.assign(settings, updateDto);
    return settings.save();
  }

  async initializeDefaultSettings(): Promise<InstitutionalSettingDocument> {
    const existing = await this.settingModel.findOne().exec();
    if (existing) {
      return existing;
    }

    const defaultSettings = new this.settingModel({
      name: 'Instituto de Educación Superior Tecnológico Privado Ciencias de la Salud',
      location: 'Pucallpa, Perú',
      colors: {
        primary: '#1e3a8a', // Azul institucional
        secondary: '#f59e0b', // Dorado
        white: '#ffffff',
        gray: '#f3f4f6',
        success: '#10b981',
        danger: '#ef4444',
      },
      maxFileSizeBytes: 10485760,
      allowedFileTypes: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3'],
      trashRetentionDays: 30,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
      },
      timezone: 'America/Lima',
      examMessages: {
        defaultWarning: 'Estás siendo supervisado. Cualquier intento de hacer trampa será registrado.',
        focusLost: 'Has perdido el foco de la ventana. Este evento ha sido registrado.',
        tabChange: 'Has cambiado de pestaña. Este evento ha sido registrado.',
      },
    });

    return defaultSettings.save();
  }
}
