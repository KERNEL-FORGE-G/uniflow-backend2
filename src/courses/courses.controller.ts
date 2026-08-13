// src/courses/courses.controller.ts
//
// RBAC (§5.1 du CDC) : Admin/Secrétariat gèrent tous les cours ;
// l'Enseignant ne gère que les siens (filtré via findByTeacher, pas
// via un guard générique — la restriction "ses cours" dépend de la donnée,
// pas juste du rôle).

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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags('05 - Cours & Éléments Constitutifs (EC)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau cours' })
  @ApiResponse({ status: 201, description: 'Cours créé avec succès' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SECRETARIAT', 'ETUDIANT', 'STUDENT', 'ENSEIGNANT', 'TEACHER')
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les cours' })
  @ApiResponse({ status: 200, description: 'Liste des cours' })
  findAll() {
    return this.coursesService.findAll();
  }

  @Get('my')
  @ApiOperation({ summary: 'Lister mes cours (pour enseignant connecté)' })
  @ApiResponse({ status: 200, description: 'Mes cours' })
  findMine(@Request() req: AuthenticatedRequest) {
    return this.coursesService.findMineByUserId(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un cours' })
  @ApiParam({ name: 'id', description: 'ID du cours' })
  @ApiResponse({ status: 200, description: 'Détails du cours' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un cours' })
  @ApiParam({ name: 'id', description: 'ID du cours' })
  @ApiResponse({ status: 200, description: 'Cours mis à jour' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SECRETARIAT', 'ETUDIANT', 'STUDENT', 'ENSEIGNANT', 'TEACHER')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un cours' })
  @ApiParam({ name: 'id', description: 'ID du cours' })
  @ApiResponse({ status: 200, description: 'Cours supprimé' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SECRETARIAT', 'ETUDIANT', 'STUDENT', 'ENSEIGNANT', 'TEACHER')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}
