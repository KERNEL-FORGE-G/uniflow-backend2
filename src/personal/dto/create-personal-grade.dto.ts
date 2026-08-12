import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreatePersonalGradeDto {
  @ApiProperty({ example: 'psub_1', description: 'ID de la matière' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ example: 'Contrôle Continu 1', description: 'Intitulé de l évaluation' })
  @IsString()
  @IsNotEmpty()
  evaluationTitle: string;

  @ApiProperty({ example: 14.50, description: 'Note obtenue' })
  @IsNumber()
  @Min(0)
  score: number;

  @ApiPropertyOptional({ example: 20.00, description: 'Note maximale' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxScore?: number;

  @ApiPropertyOptional({ example: 0.30, description: 'Coefficient de l évaluation' })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  coefficient?: number;

  @ApiPropertyOptional({ example: '2026-03-15', description: 'Date de l évaluation (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  evaluationDate?: string;
}
