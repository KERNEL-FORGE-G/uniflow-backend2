import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StatsService } from './stats.service';

@ApiTags('11 - Statistiques & Rapports')
@ApiBearerAuth('JWT-auth')
@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Aperçu global des statistiques académiques' })
  @ApiResponse({ status: 200, description: 'Statistiques agrégées du système' })
  @Roles('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'DIRECTION', 'ENSEIGNANT', 'DELEGUE', 'ETUDIANT')
  async getOverview() {
    return this.statsService.getOverview();
  }
}
