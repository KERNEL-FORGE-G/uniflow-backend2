// src/classrooms/classrooms.controller.ts
//
// Endpoints REST pour les salles (§10.2 du CDC : /classrooms, /classrooms/available).
// JwtAuthGuard protège tous les endpoints par défaut (authentification requise) ;
// RolesGuard + @Roles() restreignent l'écriture aux rôles habilités (§5.1 du CDC).

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';

@ApiTags('08 - Infrastructures & Salles')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classrooms')
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle salle de classe / amphi' })
  @ApiResponse({ status: 201, description: 'Salle créée avec succès' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SECRETARIAT')
  create(@Body() dto: CreateClassroomDto) {
    return this.classroomsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les salles de classe' })
  @ApiResponse({ status: 200, description: 'Liste des salles' })
  findAll() {
    return this.classroomsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'une salle de classe' })
  @ApiParam({ name: 'id', description: 'ID de la salle' })
  @ApiResponse({ status: 200, description: 'Détails de la salle' })
  findOne(@Param('id') id: string) {
    return this.classroomsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une salle de classe' })
  @ApiParam({ name: 'id', description: 'ID de la salle' })
  @ApiResponse({ status: 200, description: 'Salle mise à jour' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SECRETARIAT')
  update(@Param('id') id: string, @Body() dto: UpdateClassroomDto) {
    return this.classroomsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une salle' })
  @ApiParam({ name: 'id', description: 'ID de la salle' })
  @ApiResponse({ status: 200, description: 'Salle supprimée' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.classroomsService.remove(id);
  }
}
