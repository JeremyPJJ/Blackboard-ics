import { IsNotEmpty, IsString, IsOptional, IsArray, IsDate, IsEnum, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { CourseStatus } from '../schemas/course.schema';

/** Vocabulario fijo de tipos de curso (R6-1): lista blanca validada por @IsIn. */
export const COURSE_CAREERS = ['Empleabilidad', 'Técnica', 'Laboratorio', 'Enfermería', 'Farmacia'] as const;

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(COURSE_CAREERS)
  career: string;

  @IsNumber()
  @IsOptional()
  credits?: number;

  @IsNumber()
  @IsOptional()
  year?: number;

  @IsNumber()
  @IsOptional()
  semester?: number;

  @IsNumber()
  @IsOptional()
  cycle?: number;

  @IsArray()
  @IsOptional()
  teachers?: Array<{ userId: string; role: string }>;

  @IsArray()
  @IsOptional()
  students?: Array<{ userId: string; role: string }>;

  @IsArray()
  @IsOptional()
  weeks?: any[];

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  endDate: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expirationDate?: Date;

  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus;
}
