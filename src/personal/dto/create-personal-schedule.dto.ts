import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DayOfWeek } from '@prisma/client';

export class CreatePersonalScheduleDto {
  @ApiProperty({ example: 'psub_1', description: 'ID de la matière' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ enum: DayOfWeek, example: DayOfWeek.LUNDI, description: 'Jour de la semaine' })
  @IsEnum(DayOfWeek)
  @IsNotEmpty()
  dayOfWeek: DayOfWeek;

  @ApiProperty({ example: '08:00:00', description: 'Heure de début (HH:mm:ss)' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '10:00:00', description: 'Heure de fin (HH:mm:ss)' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ example: 'Amphi 300', description: 'Salle de cours' })
  @IsString()
  @IsOptional()
  classroomLocation?: string;

  @ApiPropertyOptional({ example: 'Prendre le matériel de TP', description: 'Notes personnelles' })
  @IsString()
  @IsOptional()
  notes?: string;
}
