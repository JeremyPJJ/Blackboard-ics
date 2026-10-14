import { IsNotEmpty, IsString, IsOptional, IsNumber, IsArray, IsEnum, IsDate } from 'class-validator';
import { ExamStatus, QuestionType } from '../schemas/exam.schema';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsArray()
  @IsOptional()
  options?: Array<{ text: string; isCorrect: boolean }>;

  @IsString()
  @IsOptional()
  correctAnswer?: string;

  @IsNumber()
  points: number;

  @IsString()
  @IsOptional()
  explanation?: string;
}

export class CreateExamDto {
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
  sessionNumber: number;

  @IsArray()
  questions: CreateQuestionDto[];

  @IsDate()
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @IsOptional()
  endDate?: Date;

  @IsNumber()
  duration: number;

  @IsNumber()
  maxAttempts: number;

  @IsEnum(ExamStatus)
  @IsOptional()
  status?: ExamStatus;

  @IsNumber()
  @IsOptional()
  passingScore?: number;

  @IsOptional()
  shuffleQuestions?: boolean;

  @IsOptional()
  shuffleOptions?: boolean;

  @IsOptional()
  showResults?: boolean;

  @IsOptional()
  showCorrectAnswers?: boolean;

  @IsString()
  @IsOptional()
  supervisionMessage?: string;
}
