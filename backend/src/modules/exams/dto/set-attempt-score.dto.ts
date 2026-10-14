import { IsNumber, Min } from 'class-validator';

export class SetAttemptScoreDto {
  @IsNumber()
  @Min(0)
  score: number;
}