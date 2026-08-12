// src/videoconference/videoconference.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
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
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { VideoconferenceService } from './videoconference.service';
import type { LiveKitWebhookPayload } from './videoconference.service';
import { CreateConferenceDto } from './dto/create-conference.dto';
import { SetLocalUrlDto } from './dto/set-local-url.dto';
import { UpdateNetworkDto } from './dto/update-network.dto';

interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

@ApiTags('09 - Visioconférence LiveKit (Mode Hybride / Local)')
@ApiBearerAuth('JWT-auth')
@Controller('conferences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VideoconferenceController {
  constructor(private readonly service: VideoconferenceService) {}

  @Post()
  @ApiOperation({ summary: 'Démarrer une visioconférence / classe virtuelle' })
  @ApiResponse({ status: 201, description: 'Session créée' })
  @Roles('ENSEIGNANT', 'ADMIN', 'SUPER_ADMIN')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto?: CreateConferenceDto,
  ) {
    return this.service.create(
      user.userId,
      dto?.courseId,
      dto?.maxParticipants,
    );
  }

  @Get(':id/join')
  @ApiOperation({ summary: 'Rejoindre une session de visioconférence' })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({ status: 200, description: 'Token LiveKit généré pour rejoindre' })
  join(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.join(id, user.userId);
  }

  @Patch(':id/local-url')
  @ApiOperation({ summary: 'Définir l\'URL du serveur WebRTC local' })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({ status: 200, description: 'URL WebRTC locale mise à jour' })
  @Roles('ENSEIGNANT', 'ADMIN', 'SUPER_ADMIN')
  setLocalUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SetLocalUrlDto,
  ) {
    return this.service.setLocalUrl(id, user.userId, dto.localUrl);
  }

  @Patch(':id/network')
  @ApiOperation({ summary: 'Bascule du mode réseau (Local / Cloud Internet)' })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({ status: 200, description: 'Mode réseau mis à jour' })
  @Roles('ENSEIGNANT', 'ADMIN', 'SUPER_ADMIN')
  enableInternet(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateNetworkDto,
  ) {
    return this.service.enableInternetMode(id, user.userId, dto.publicUrl);
  }

  @Post(':id/end')
  @ApiOperation({ summary: 'Mettre fin à la visioconférence' })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({ status: 200, description: 'Session terminée' })
  @HttpCode(HttpStatus.OK)
  @Roles('ENSEIGNANT', 'ADMIN', 'SUPER_ADMIN')
  end(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.end(id, user.userId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook d\'événements LiveKit' })
  @ApiResponse({ status: 200, description: 'Webhook traité' })
  @Public()
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Body() body: LiveKitWebhookPayload) {
    return this.service.handleWebhook(body);
  }
}
