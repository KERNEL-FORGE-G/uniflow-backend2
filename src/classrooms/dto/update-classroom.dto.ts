// src/classrooms/dto/update-classroom.dto.ts
//
// PartialType rend tous les champs du CreateClassroomDto optionnels,
// pour permettre une mise à jour partielle (PATCH) sans redéfinir chaque champ.

import { PartialType } from '@nestjs/mapped-types';
import { CreateClassroomDto } from './create-classroom.dto';

export class UpdateClassroomDto extends PartialType(CreateClassroomDto) {}
