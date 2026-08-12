import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TaskPriority, TaskStatus } from '@prisma/client';

export class CreatePersonalTaskDto {
  @ApiPropertyOptional({ example: 'psub_1', description: 'ID de la matière associée' })
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiProperty({ example: 'Préparer le TP de C++', description: 'Titre de la tâche' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Réviser les pointeurs et vecteurs', description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2026-03-20T18:00:00Z', description: 'Date d échéance' })
  @IsString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.MEDIUM })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.TODO })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
