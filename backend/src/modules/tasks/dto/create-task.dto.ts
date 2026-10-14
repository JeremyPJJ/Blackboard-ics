import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDate, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus, GradingType } from '../schemas/task.schema';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsNumber()
  weekNumber: number;

  @IsNumber()
  @IsOptional()
  sessionNumber?: number;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  deadline?: Date;

  @IsOptional()
  noDeadline?: boolean;

  @IsArray()
  @IsOptional()
  allowedTypes?: string[];

  @IsNumber()
  @IsOptional()
  maxFileSize?: number;

  @IsNumber()
  @IsOptional()
  maxFiles?: number;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(GradingType)
  @IsOptional()
  gradingType?: GradingType;

  @IsNumber()
  @IsOptional()
  maxScore?: number;
}
