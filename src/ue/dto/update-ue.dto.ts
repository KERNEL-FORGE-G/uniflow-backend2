import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  IsUUID,
  IsArray,
  Min,
} from 'class-validator';
import { UEType } from '@prisma/client';

export class UpdateUeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  credits?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  hoursCM?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  hoursTD?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  hoursTP?: number;

  @IsOptional()
  @IsEnum(UEType)
  type?: UEType;

  @IsOptional()
  @IsUUID()
  levelId?: string;

  @IsOptional()
  @IsUUID()
  semesterId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  specialtyIds?: string[];
}
