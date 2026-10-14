import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class SubmitTaskDto {
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsArray()
  @IsOptional()
  fileIds?: string[];

  @IsString()
  @IsOptional()
  comments?: string;

  @IsString()
  @IsOptional()
  lateReason?: string;
}
