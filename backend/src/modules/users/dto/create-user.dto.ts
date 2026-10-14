import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, UserStatus } from '../schemas/user.schema';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  dni: string;

  @IsString()
  @IsNotEmpty()
  names: string;

  @IsString()
  @IsNotEmpty()
  lastNames: string;

  @IsEmail()
  @IsNotEmpty()
  institutionalEmail: string;

  @IsEmail()
  @IsOptional()
  personalEmail?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @Type(() => Date)
  @IsOptional()
  birthDate?: Date;

  @IsString()
  @IsOptional()
  photo?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsOptional()
  permissions?: string[];

  @IsNumber()
  @IsOptional()
  contractYear?: number;

  @IsNumber()
  @IsOptional()
  contractSemester?: number;
}
