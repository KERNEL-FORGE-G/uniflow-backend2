import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { SyncPushDto } from './dto/sync-push.dto';
import { SyncPullDto } from './dto/sync-pull.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('12 - Synchronisation Offline-First')
@ApiBearerAuth('JWT-auth')
@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Post('push')
  @ApiOperation({ summary: 'Synchronisation montante (Push) - Envoi des mutations locales hors-ligne' })
  @ApiResponse({ status: 201, description: 'Opérations poussées et synchronisées' })
  async push(@Body() dto: SyncPushDto) {
    return this.syncService.push(dto.operations);
  }

  @Get('pull')
  @ApiOperation({ summary: 'Synchronisation descendante (Pull) - Récupération des changements depuis une date' })
  @ApiQuery({ name: 'since', required: false, description: 'Timestamp de la dernière synchronisation (ISO string)' })
  @ApiResponse({ status: 200, description: 'Données modifiées depuis la date spécifiée' })
  async pull(@Query() query: SyncPullDto) {
    return this.syncService.pull(query.since);
  }
}
