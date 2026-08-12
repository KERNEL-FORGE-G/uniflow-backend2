import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
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
import { Request as ExpressRequest } from 'express';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags('10 - Notifications & Avis')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Envoyer une notification' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Notification créée' })
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'DIRECTION')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister mes notifications' })
  @ApiQuery({ name: 'unreadOnly', required: false, description: 'Filtrer uniquement les non lues (true/false)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Liste des notifications' })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.findAllForUser(
      req.user.userId,
      unreadOnly === 'true',
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Nombre de notifications non lues' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Compteur de notifications non lues' })
  async countUnread(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.countUnread(req.user.userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statut mis à jour' })
  async markAsRead(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une notification' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Notification supprimée' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    await this.notificationsService.remove(id, req.user.userId);
  }
}
