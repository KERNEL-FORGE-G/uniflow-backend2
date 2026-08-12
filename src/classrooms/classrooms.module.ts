// src/classrooms/classrooms.module.ts

import { Module } from '@nestjs/common';
import { ClassroomsService } from './classrooms.service';
import { ClassroomsController } from './classrooms.controller';

@Module({
  controllers: [ClassroomsController],
  providers: [ClassroomsService],
  exports: [ClassroomsService], // utilisé plus tard par le module `schedules`
})
export class ClassroomsModule {}
