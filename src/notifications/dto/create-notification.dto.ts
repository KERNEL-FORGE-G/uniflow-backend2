import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { NotificationType, NotificationChannel } from '@prisma/client';

export class CreateNotificationDto {
  @IsUUID()
  userId!: string;

  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;
}
