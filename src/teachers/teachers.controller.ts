import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('03 - Enseignants & Corps Professoral')
@ApiBearerAuth('JWT-auth')
@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private teachersService: TeachersService) {}

  @Post()
  @ApiOperation({ summary: 'Enregistrer un nouvel enseignant' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Enseignant créé avec succès' })
  @Roles('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTeacherDto) {
    return this.teachersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les enseignants' })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page' })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Taille de page' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Liste des enseignants' })
  @Roles('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'DIRECTION')
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.teachersService.findAll(
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un enseignant' })
  @ApiParam({ name: 'id', description: 'ID de l\'enseignant' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Détails de l\'enseignant' })
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'SECRETARIAT',
    'DIRECTION',
    'ENSEIGNANT',
    'ETUDIANT',
  )
  async findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour la fiche enseignant' })
  @ApiParam({ name: 'id', description: 'ID de l\'enseignant' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Mise à jour réussie' })
  @Roles('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT')
  async update(@Param('id') id: string, @Body() dto: UpdateTeacherDto) {
    return this.teachersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un enseignant' })
  @ApiParam({ name: 'id', description: 'ID de l\'enseignant' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Enseignant supprimé' })
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.teachersService.remove(id);
  }
}
