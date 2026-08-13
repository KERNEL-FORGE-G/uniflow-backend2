import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
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
  @Get(':id')
  @ApiOperation({ summary: 'Détails d une matière' })
  getSubjectById(@Param('id') id: string, @Req() req: any) {
    return this.personalService.getSubjectById(id, req.user?.userId);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Ajouter une nouvelle matière autonome' })
  createSubject(@Body() dto: CreatePersonalSubjectDto, @Req() req: any) {
    return this.personalService.createSubject(dto, req.user?.userId);
  }

  @Public()
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une matière' })
  updateSubjectPut(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.personalService.updateSubject(id, dto, req.user?.userId);
  }

  @Public()
  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une matière' })
  updateSubjectPatch(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.personalService.updateSubject(id, dto, req.user?.userId);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une matière' })
  deleteSubject(@Param('id') id: string, @Req() req: any) {
    return this.personalService.deleteSubject(id, req.user?.userId);
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

  @Public()
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un créneau' })
  updateSchedulePut(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.personalService.updateSchedule(id, dto, req.user?.userId);
  }

  @Public()
  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un créneau' })
  updateSchedulePatch(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.personalService.updateSchedule(id, dto, req.user?.userId);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un créneau' })
  deleteSchedule(@Param('id') id: string, @Req() req: any) {
    return this.personalService.deleteSchedule(id, req.user?.userId);
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

  @Public()
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une note' })
  updateGradePut(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.personalService.updateGrade(id, dto, req.user?.userId);
  }

  @Public()
  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une note' })
  updateGradePatch(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.personalService.updateGrade(id, dto, req.user?.userId);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une note' })
  deleteGrade(@Param('id') id: string, @Req() req: any) {
    return this.personalService.deleteGrade(id, req.user?.userId);
  }
}

@ApiTags('Personal Tasks & Devoirs')
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

  @Public()
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une tâche' })
  updateTaskPut(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.personalService.updateTask(id, dto, req.user?.userId);
  }

  @Public()
  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une tâche' })
  updateTaskPatch(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.personalService.updateTask(id, dto, req.user?.userId);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une tâche' })
  deleteTask(@Param('id') id: string, @Req() req: any) {
    return this.personalService.deleteTask(id, req.user?.userId);
  }
}

@ApiTags('Assignments')
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly personalService: PersonalService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lister les devoirs et travaux à rendre' })
  getAssignments(@Req() req: any) {
    return this.personalService.getTasks(req.user?.userId);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Créer un devoir' })
  createAssignment(@Body() dto: any, @Req() req: any) {
    return this.personalService.createTask(dto, req.user?.userId);
  }

  @Public()
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un devoir' })
  updateAssignmentPut(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.personalService.updateTask(id, dto, req.user?.userId);
  }

  @Public()
  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un devoir' })
  updateAssignmentPatch(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.personalService.updateTask(id, dto, req.user?.userId);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un devoir' })
  deleteAssignment(@Param('id') id: string, @Req() req: any) {
    return this.personalService.deleteTask(id, req.user?.userId);
  }
}

