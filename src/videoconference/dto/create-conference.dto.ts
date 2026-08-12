import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateConferenceDto {
  @IsOptional()
  @IsString()
  courseId?: string; // à confirmer avec Dev B une fois son modèle Course mergé

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  maxParticipants?: number;
}
