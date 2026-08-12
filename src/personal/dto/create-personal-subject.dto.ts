import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreatePersonalSubjectDto {
  @ApiProperty({ example: 'INF204', description: 'Code de la matière' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Structures de Données C++', description: 'Nom de la matière' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Dr. Etoa', description: 'Nom de l enseignant' })
  @IsString()
  @IsOptional()
  instructorName?: string;

  @ApiPropertyOptional({ example: 3, description: 'Nombre de crédits' })
  @IsInt()
  @Min(1)
  @IsOptional()
  credits?: number;

  @ApiPropertyOptional({ example: '#10b981', description: 'Couleur Hex d affichage' })
  @IsString()
  @IsOptional()
  colorHex?: string;

  @ApiPropertyOptional({ example: 'Semestre 1', description: 'Libellé du semestre' })
  @IsString()
  @IsOptional()
  semesterLabel?: string;
}
