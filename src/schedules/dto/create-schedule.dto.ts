// src/schedules/dto/create-schedule.dto.ts

import { IsUUID, IsEnum, IsMilitaryTime } from 'class-validator';
import { DayOfWeek } from '@prisma/client';

export class CreateScheduleDto {
  @IsUUID()
  courseId!: string;

  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  // Format "HH:mm" (ex. "08:00") — validé en chaîne, converti en DateTime
  // dans le service avant écriture en base (@db.Time attend un DateTime Prisma).
  @IsMilitaryTime()
  startTime!: string;

  @IsMilitaryTime()
  endTime!: string;
}
