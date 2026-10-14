import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsObject } from 'class-validator';
import { CreateCourseDto } from './create-course.dto';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
  // Guardado de configuración de notas desde el gradebook (Spec: persistencia
  // de variables/pesos y notas manuales). Shape: course.schema gradebookConfig.
  @IsOptional()
  @IsObject()
  gradebookConfig?: {
    variables?: Array<{ key: string; label: string; weight: number; source: string }>;
    manualScores?: Record<string, number>;
  };
}
