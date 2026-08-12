import { IsEnum } from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';

export class UpdateEnrollmentDto {
  @IsEnum(EnrollmentStatus)
  status!: EnrollmentStatus;
}
