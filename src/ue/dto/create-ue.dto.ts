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

export class CreateUeDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsInt()
  @Min(1)
  credits!: number;

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

  @IsUUID()
  levelId!: string;

  @IsUUID()
  semesterId!: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  specialtyIds?: string[];
}
