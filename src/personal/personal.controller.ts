import {
  Controller,
  Get,
  Post,
  Body,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PersonalService } from './personal.service';
import { CreatePersonalSubjectDto } from './dto/create-personal-subject.dto';
import { CreatePersonalScheduleDto } from './dto/create-personal-schedule.dto';
import { CreatePersonalGradeDto } from './dto/create-personal-grade.dto';
import { CreatePersonalTaskDto } from './dto/create-personal-task.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Personal Subjects')
@Controller('personal/subjects')
export class PersonalSubjectsController {
  constructor(private readonly personalService: PersonalService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lister les matières autonomes' })
  getSubjects(@Req() req: any) {
    return this.personalService.getSubjects(req.user?.userId);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Ajouter une nouvelle matière autonome' })
  createSubject(@Body() dto: CreatePersonalSubjectDto, @Req() req: any) {
    return this.personalService.createSubject(dto, req.user?.userId);
  }
}

@ApiTags('Personal Schedules')
@Controller('personal/schedules')
export class PersonalSchedulesController {
  constructor(private readonly personalService: PersonalService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Consulter emploi du temps personnel' })
  getSchedules(@Req() req: any) {
    return this.personalService.getSchedules(req.user?.userId);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Ajouter un créneau d emploi du temps personnel' })
  createSchedule(@Body() dto: CreatePersonalScheduleDto, @Req() req: any) {
    return this.personalService.createSchedule(dto, req.user?.userId);
  }
}

@ApiTags('Personal Grades')
@Controller('personal/grades')
export class PersonalGradesController {
  constructor(private readonly personalService: PersonalService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Consulter le relevé de notes personnel' })
  getGrades(@Req() req: any) {
    return this.personalService.getGrades(req.user?.userId);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Ajouter une note personnelle' })
  createGrade(@Body() dto: CreatePersonalGradeDto, @Req() req: any) {
    return this.personalService.createGrade(dto, req.user?.userId);
  }
}

@ApiTags('Personal Tasks')
@Controller('personal/tasks')
export class PersonalTasksController {
  constructor(private readonly personalService: PersonalService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Consulter les tâches et rappels personnels' })
  getTasks(@Req() req: any) {
    return this.personalService.getTasks(req.user?.userId);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Créer une tâche personnelle' })
  createTask(@Body() dto: CreatePersonalTaskDto, @Req() req: any) {
    return this.personalService.createTask(dto, req.user?.userId);
  }
}
