import { IsOptional, IsDateString } from 'class-validator';

export class SyncPullDto {
  @IsOptional()
  @IsDateString()
  since?: string;
}
