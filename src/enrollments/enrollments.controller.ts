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
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('02 - Inscriptions des Étudiants')
@ApiBearerAuth('JWT-auth')
@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Inscrire un étudiant à une UE / Spécialité' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Inscription effectuée' })
  @Roles('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'ETUDIANT')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les inscriptions' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'Liste des inscriptions' })
  @Roles('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'DIRECTION', 'ENSEIGNANT')
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.enrollmentsService.findAll(
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @Get('by-student/:studentId')
  @ApiOperation({ summary: 'Inscriptions d\'un étudiant spécifique' })
  @ApiParam({ name: 'studentId', description: 'ID de l\'étudiant' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Inscriptions de l\'étudiant' })
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'SECRETARIAT',
    'DIRECTION',
    'ENSEIGNANT',
    'ETUDIANT',
  )
  async findByStudent(@Param('studentId') studentId: string) {
    return this.enrollmentsService.findByStudent(studentId);
  }

  @Get('by-ue/:teachingUnitId')
  @ApiOperation({ summary: 'Étudiants inscrits à une UE' })
  @ApiParam({ name: 'teachingUnitId', description: 'ID de l\'Unité d\'Enseignement' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Liste des étudiants inscrits à l\'UE' })
  @Roles('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'DIRECTION', 'ENSEIGNANT')
  async findByTeachingUnit(@Param('teachingUnitId') teachingUnitId: string) {
    return this.enrollmentsService.findByTeachingUnit(teachingUnitId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'une inscription' })
  @ApiParam({ name: 'id', description: 'ID de l\'inscription' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Détails de l\'inscription' })
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'SECRETARIAT',
    'DIRECTION',
    'ENSEIGNANT',
    'ETUDIANT',
  )
  async findOne(@Param('id') id: string) {
    return this.enrollmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une inscription (statut, notes...)' })
  @ApiParam({ name: 'id', description: 'ID de l\'inscription' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Mise à jour effectuée' })
  @Roles('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT')
  async update(@Param('id') id: string, @Body() dto: UpdateEnrollmentDto) {
    return this.enrollmentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Annuler / Supprimer une inscription' })
  @ApiParam({ name: 'id', description: 'ID de l\'inscription' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Inscription annulée' })
  @Roles('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.enrollmentsService.remove(id);
  }
}
