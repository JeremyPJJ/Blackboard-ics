import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDate, IsEnum } from 'class-validator';
import { AttendanceStatus } from '../schemas/attendance-register.schema';

export class MarkAttendanceDto {
  @IsString()
  @IsNotEmpty()
  registerId: string;

  @IsNumber()
  dateIndex: number;

  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}
