import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StudentStatus } from '@prisma/client';

export class CreateStudentDto {
  @ApiProperty({ description: 'Email de l\'étudiant', example: 'etudiant@univ.fr' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Mot de passe initial', example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ description: 'Prénom de l\'étudiant' })
  @IsString()
  firstName!: string;

  @ApiProperty({ description: 'Nom de famille de l\'étudiant' })
  @IsString()
  lastName!: string;

  @ApiPropertyOptional({ enum: StudentStatus, description: 'Statut de l\'étudiant' })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @ApiProperty({ description: 'ID du niveau d\'étude' })
  @IsUUID()
  levelId!: string;

  @ApiPropertyOptional({ description: 'ID de la spécialité' })
  @IsOptional()
  @IsUUID()
  specialtyId?: string;
}
