// src/classrooms/dto/create-classroom.dto.ts
//
// DTO de création d'une salle. class-validator valide automatiquement
// ces règles grâce au ValidationPipe global configuré dans main.ts
// (whitelist + forbidNonWhitelisted + transform).

import { IsString, IsInt, IsEnum, IsOptional, Min } from 'class-validator';
import { ClassroomType } from '@prisma/client';

export class CreateClassroomDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  building?: string;

  @IsInt()
  @Min(1) // une salle de capacité 0 n'a pas de sens
  capacity!: number;

  @IsEnum(ClassroomType)
  type!: ClassroomType;
}
