import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminToolService } from './admin-tool.service';

@ApiTags('15 - Administration BDD')
@ApiBearerAuth('JWT-auth')
@Controller('admin-tool')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminToolController {
  constructor(private readonly service: AdminToolService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Statistiques globales du tableau de bord administrateur',
    description: 'Retourne le nombre total d\'enregistrements actifs par entité principale.',
  })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  getDashboardStats() {
    return this.service.getDashboardStats();
  }

  @Get('tables')
  @ApiOperation({
    summary: 'Liste des tables administrables',
    description: 'Retourne la liste des clés de tables, libellés et groupes configurés pour l\'administration.',
  })
  @ApiResponse({ status: 200, description: 'Liste des tables récupérée' })
  listTables() {
    return this.service.listTables();
  }

  @Get('tables/:table/schema')
  @ApiOperation({
    summary: 'Schéma dynamique d\'une table',
    description: 'Retourne la liste des champs, types et options pour générer dynamiquement les formulaires d\'édition/création.',
  })
  @ApiParam({ name: 'table', description: 'Clé de la table (ex: users, students, teaching_units)' })
  @ApiResponse({ status: 200, description: 'Schéma du formulaire récupéré' })
  getSchema(@Param('table') table: string) {
    return this.service.getFormSchema(table);
  }

  @Get('tables/:table/data')
  @ApiOperation({
    summary: 'Liste paginée des données d\'une table',
    description: 'Récupère la liste des données avec support de recherche et de pagination.',
  })
  @ApiParam({ name: 'table', description: 'Clé de la table' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Numéro de page' })
  @ApiQuery({ name: 'pageSize', required: false, example: 15, description: 'Nombre de lignes par page' })
  @ApiQuery({ name: 'search', required: false, description: 'Terme de recherche texte' })
  @ApiResponse({ status: 200, description: 'Données récupérées avec succès' })
  getData(
    @Param('table') table: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = pageSize ? parseInt(pageSize, 10) : 15;
    return this.service.getData(table, pageNum, limitNum, search);
  }

  @Get('tables/:table/data/:id')
  @ApiOperation({
    summary: 'Détails d\'un enregistrement',
    description: 'Récupère les détails d\'un enregistrement spécifique par son identifiant ID.',
  })
  @ApiParam({ name: 'table', description: 'Clé de la table' })
  @ApiParam({ name: 'id', description: 'Identifiant unique de l\'enregistrement' })
  @ApiResponse({ status: 200, description: 'Détails récupérés' })
  getOne(@Param('table') table: string, @Param('id') id: string) {
    return this.service.getOne(table, id);
  }

  @Post('tables/:table')
  @ApiOperation({
    summary: 'Insérer un nouvel enregistrement',
    description: 'Crée un nouvel enregistrement avec conversion automatique des types et hachage sécurisé.',
  })
  @ApiParam({ name: 'table', description: 'Clé de la table' })
  @ApiResponse({ status: 201, description: 'Enregistrement créé avec succès' })
  insert(@Param('table') table: string, @Body() body: Record<string, any>) {
    return this.service.insert(table, body);
  }

  @Patch('tables/:table/data/:id')
  @ApiOperation({
    summary: 'Mettre à jour un enregistrement',
    description: 'Met à jour un enregistrement existant.',
  })
  @ApiParam({ name: 'table', description: 'Clé de la table' })
  @ApiParam({ name: 'id', description: 'Identifiant de l\'enregistrement' })
  @ApiResponse({ status: 200, description: 'Enregistrement mis à jour' })
  update(
    @Param('table') table: string,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.service.update(table, id, body);
  }

  @Delete('tables/:table/data/:id')
  @ApiOperation({
    summary: 'Supprimer un enregistrement',
    description: 'Supprime un enregistrement (soft delete si disponible, sinon hard delete).',
  })
  @ApiParam({ name: 'table', description: 'Clé de la table' })
  @ApiParam({ name: 'id', description: 'Identifiant de l\'enregistrement' })
  @ApiResponse({ status: 200, description: 'Enregistrement supprimé' })
  delete(@Param('table') table: string, @Param('id') id: string) {
    return this.service.delete(table, id);
  }
}
