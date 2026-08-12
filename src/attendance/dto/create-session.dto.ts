import { IsUUID, IsDateString } from 'class-validator';

export class CreateSessionDto {
  @IsUUID()
  courseId!: string;

  @IsDateString()
  date!: string;
}
