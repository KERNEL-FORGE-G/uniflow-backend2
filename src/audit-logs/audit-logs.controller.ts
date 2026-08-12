import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('13 - Traces & Logs d\'Audit')
@ApiBearerAuth('JWT-auth')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Consulter l\'historique des logs d\'audit système' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'resource', required: false, description: 'Filtrer par ressource impactée' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filtrer par utilisateur auteur' })
  @ApiResponse({ status: 200, description: 'Logs d\'audit récupérés' })
  @Roles('SUPER_ADMIN', 'ADMIN')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('resource') resource?: string,
    @Query('userId') userId?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.auditLogsService.findAll(pageNum, limitNum, resource, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un log d\'audit' })
  @ApiParam({ name: 'id', description: 'ID du log' })
  @ApiResponse({ status: 200, description: 'Détails du log' })
  @Roles('SUPER_ADMIN', 'ADMIN')
  async findOne(@Param('id') id: string) {
    const log = await this.auditLogsService.findOne(id);
    if (!log) {
      throw new NotFoundException(`Audit log #${id} not found`);
    }
    return log;
  }
}
