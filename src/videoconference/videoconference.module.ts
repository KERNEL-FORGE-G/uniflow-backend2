// src/videoconference/videoconference.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VideoconferenceController } from './videoconference.controller';
import { VideoconferenceService } from './videoconference.service';

@Module({
  imports: [PrismaModule],
  controllers: [VideoconferenceController],
  providers: [VideoconferenceService],
})
export class VideoconferenceModule {}
