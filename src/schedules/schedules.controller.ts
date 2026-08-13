// src/schedules/schedules.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { GenerateSchedulesDto } from './dto/generate-schedules.dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags('06 - Emplois du Temps')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un creneau d\'emploi du temps' })
  @ApiResponse({ status: 201, description: 'Créneaux créé avec succès' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SECRETARIAT', 'ETUDIANT', 'STUDENT', 'ENSEIGNANT', 'TEACHER')
  create(@Body() dto: CreateScheduleDto) {
    return this.schedulesService.create(dto);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Générer automatiquement des emplois du temps' })
  @ApiResponse({ status: 201, description: 'Génération automatique terminée' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SECRETARIAT')
  generate(@Body() dto: GenerateSchedulesDto) {
    return this.schedulesService.generate(dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Mon emploi du temps personnel' })
  @ApiResponse({ status: 200, description: 'Liste de mes créneaux de cours' })
  findMine(@Request() req: AuthenticatedRequest) {
    return this.schedulesService.findMineByUserId(req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les créneaux d\'emploi du temps' })
  @ApiResponse({ status: 200, description: 'Liste des créneaux de la semaine' })
  findAll() {
    return this.schedulesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un créneau d\'emploi du temps' })
  @ApiParam({ name: 'id', description: 'ID du créneau' })
  @ApiResponse({ status: 200, description: 'Détails du créneau' })
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un créneau' })
  @ApiParam({ name: 'id', description: 'ID du créneau' })
  @ApiResponse({ status: 200, description: 'Créneau mis à jour' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SECRETARIAT', 'ETUDIANT', 'STUDENT', 'ENSEIGNANT', 'TEACHER')
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.schedulesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un créneau' })
  @ApiParam({ name: 'id', description: 'ID du créneau' })
  @ApiResponse({ status: 200, description: 'Créneau supprimé' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SECRETARIAT', 'ETUDIANT', 'STUDENT', 'ENSEIGNANT', 'TEACHER')
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }
}
