import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Amina' })
  @IsString()
  @IsOptional()
  @Length(1, 80)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Nkomo' })
  @IsString()
  @IsOptional()
  @Length(1, 120)
  lastName?: string;

  @ApiPropertyOptional({ example: 'amina@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'CM' })
  @IsString()
  @IsOptional()
  @Length(2, 3)
  countryCode?: string;

  @ApiPropertyOptional({ enum: ['XAF', 'EUR', 'USD'] })
  @IsIn(['XAF', 'EUR', 'USD'])
  @IsOptional()
  preferredCurrency?: string;
}

export type ProfileUpdateInput = UpdateProfileDto;

function trimOptional(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizeProfileUpdate(dto: ProfileUpdateInput): ProfileUpdateInput {
  return {
    ...dto,
    firstName: trimOptional(dto.firstName),
    lastName: trimOptional(dto.lastName),
    email: trimOptional(dto.email)?.toLowerCase(),
    countryCode: trimOptional(dto.countryCode)?.toUpperCase(),
  };
}
