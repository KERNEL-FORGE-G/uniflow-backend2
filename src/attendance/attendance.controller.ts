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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { AttendanceService } from './attendance.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { ScanQrDto } from './dto/scan-qr.dto';
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

@ApiTags('07 - Gestion de la Présence (QR Code)')
@ApiBearerAuth('JWT-auth')
@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Créer une session de présence QR Code' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Session créée avec succès' })
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'ENSEIGNANT')
  @HttpCode(HttpStatus.CREATED)
  async createSession(@Body() dto: CreateSessionDto) {
    return this.attendanceService.createSession(dto);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Détails d\'une session de présence' })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Détails récupérés' })
  async findOne(@Param('id') id: string) {
    return this.attendanceService.findOne(id);
  }

  @Get('sessions/by-course/:courseId')
  @ApiOperation({ summary: 'Sessions de présence par cours' })
  @ApiParam({ name: 'courseId', description: 'ID du cours' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Liste des sessions du cours' })
  async findByCourse(@Param('courseId') courseId: string) {
    return this.attendanceService.findByCourse(courseId);
  }

  @Patch('sessions/:sessionId/mark')
  @ApiOperation({ summary: 'Marquer la présence des étudiants' })
  @ApiParam({ name: 'sessionId', description: 'ID de la session' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Présences enregistrées' })
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'ENSEIGNANT', 'DELEGUE')
  async markAttendance(
    @Param('sessionId') sessionId: string,
    @Body() dto: MarkAttendanceDto,
  ) {
    return this.attendanceService.markAttendance(sessionId, dto);
  }

  @Post('scan')
  @ApiOperation({ summary: 'Valider sa présence par scan QR Code (Étudiant)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Présence validée' })
  @UseGuards(RolesGuard)
  @Roles('ETUDIANT')
  async scanQr(@Body() dto: ScanQrDto, @Request() req: AuthenticatedRequest) {
    const student = await this.attendanceService.getStudentByUserId(
      req.user.userId,
    );
    return this.attendanceService.scanQr(dto, student.id);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Supprimer une session de présence' })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Session supprimée' })
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'ENSEIGNANT')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.attendanceService.remove(id);
  }
}
