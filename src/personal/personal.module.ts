import { Module } from '@nestjs/common';
import {
  PersonalSubjectsController,
  PersonalSchedulesController,
  PersonalGradesController,
  PersonalTasksController,
  AssignmentsController,
} from './personal.controller';
import { PersonalService } from './personal.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    PersonalSubjectsController,
    PersonalSchedulesController,
    PersonalGradesController,
    PersonalTasksController,
    AssignmentsController,
  ],
  providers: [PersonalService],
  exports: [PersonalService],
})
export class PersonalModule {}
