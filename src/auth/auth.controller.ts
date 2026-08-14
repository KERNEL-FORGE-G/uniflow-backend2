import {
  Body,
  Controller,
  Post,
  Patch,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags('01 - Authentification & Compte')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Créer un compte utilisateur',
    description: 'Inscription d\'un nouvel utilisateur dans le système (étudiant, enseignant, etc.).',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Compte créé avec succès' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Données invalides ou email déjà utilisé' })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Connexion utilisateur',
    description: 'Authentification par email/mot de passe pour obtenir les tokens JWT (accessToken & refreshToken).',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Authentification réussie' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Identifiants incorrects' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Rafraîchir le token JWT',
    description: 'Obtenir un nouveau jeton d\'accès valide grâce à un refreshToken valide.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Nouveau token généré' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token invalide ou expiré' })
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @Get('academic-options')
  @ApiOperation({
    summary: 'Options de la structure académique',
    description: 'Liste des facultés, départements, programmes, niveaux et spécialités pour l\'inscription.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Structure académique récupérée' })
  @HttpCode(HttpStatus.OK)
  async academicOptions() {
    return this.authService.getAcademicOptions();
  }

  @Get('specialties')
  @ApiOperation({
    summary: 'Spécialités par niveau',
    description: 'Liste les spécialités associées à un niveau d\'étude spécifique.',
  })
  @ApiQuery({ name: 'levelId', required: false, description: 'ID du niveau pour filtrer les spécialités' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Spécialités récupérées' })
  @HttpCode(HttpStatus.OK)
  async specialties(@Query('levelId') levelId?: string) {
    return this.authService.getSpecialties(levelId);
  }

  @Patch('me')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Modifier le profil du compte connecté' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profil utilisateur mis à jour' })
  async updateMe(@Request() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.userId, dto);
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Profil de l\'utilisateur connecté',
    description: 'Récupère les détails du profil et du rôle de l\'utilisateur actuellement authentifié.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profil utilisateur récupéré' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async me(@Request() req: AuthenticatedRequest) {
    return this.authService.me(req.user.userId);
  }
}
