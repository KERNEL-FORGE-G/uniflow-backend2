// src/courses/dto/create-course.dto.ts
//
// Un Course associe une UE (teachingUnitId), un enseignant (teacherId) et
// une salle (classroomId), pour un type de séance donné (CM/TD/TP) — §4.7 du CDC.
// groupLabel permet de distinguer plusieurs groupes TD/TP sur la même UE
// (ex. "TD1", "TP-Groupe A").

import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { CourseType } from '@prisma/client';

export class CreateCourseDto {
  @IsUUID()
  teachingUnitId!: string;

  @IsUUID()
  teacherId!: string;

  @IsUUID()
  classroomId!: string;

  @IsEnum(CourseType)
  type!: CourseType;

  @IsOptional()
  @IsString()
  groupLabel?: string;
}
