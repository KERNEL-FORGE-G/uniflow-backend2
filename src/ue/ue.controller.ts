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
import { UeService } from './ue.service';
import { CreateUeDto } from './dto/create-ue.dto';
import { UpdateUeDto } from './dto/update-ue.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('04 - Unités d\'Enseignement (UE)')
@ApiBearerAuth('JWT-auth')
@Controller('ue')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UeController {
  constructor(private ueService: UeService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle Unité d\'Enseignement (UE)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'UE créée avec succès' })
  @Roles('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUeDto) {
    return this.ueService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les Unités d\'Enseignement' })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page' })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Nombre d\'éléments par page' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Liste des UE' })
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'SECRETARIAT',
    'DIRECTION',
    'ENSEIGNANT',
    'DELEGUE',
    'ETUDIANT',
  )
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.ueService.findAll(
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @Get('by-level/:levelId')
  @ApiOperation({ summary: 'Lister les UE par niveau d\'étude' })
  @ApiParam({ name: 'levelId', description: 'ID du niveau' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Liste des UE pour le niveau' })
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'SECRETARIAT',
    'DIRECTION',
    'ENSEIGNANT',
    'DELEGUE',
    'ETUDIANT',
  )
  async findByLevel(@Param('levelId') levelId: string) {
    return this.ueService.findByLevel(levelId);
  }

  @Get('by-semester/:semesterId')
  @ApiOperation({ summary: 'Lister les UE par semestre' })
  @ApiParam({ name: 'semesterId', description: 'ID du semestre' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Liste des UE pour le semestre' })
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'SECRETARIAT',
    'DIRECTION',
    'ENSEIGNANT',
    'DELEGUE',
    'ETUDIANT',
  )
  async findBySemester(@Param('semesterId') semesterId: string) {
    return this.ueService.findBySemester(semesterId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'une UE par son ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'UE' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Détails de l\'UE' })
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'SECRETARIAT',
    'DIRECTION',
    'ENSEIGNANT',
    'DELEGUE',
    'ETUDIANT',
  )
  async findOne(@Param('id') id: string) {
    return this.ueService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une UE' })
  @ApiParam({ name: 'id', description: 'ID de l\'UE' })
  @ApiResponse({ status: HttpStatus.OK, description: 'UE mise à jour' })
  @Roles('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT')
  async update(@Param('id') id: string, @Body() dto: UpdateUeDto) {
    return this.ueService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une UE' })
  @ApiParam({ name: 'id', description: 'ID de l\'UE' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'UE supprimée' })
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.ueService.remove(id);
  }
}
