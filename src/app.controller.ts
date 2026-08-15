import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AppService } from './app.service';
import { AppwriteService } from './appwrite/appwrite.service';

@ApiTags('00 - Système & Santé')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly appwriteService: AppwriteService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Vérification de l\'état de l\'API (Health Check)' })
  @ApiResponse({ status: 200, description: 'L\'API est opérationnelle' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'État de configuration du runtime' })
  @ApiResponse({ status: 200, description: 'État public sans secret' })
  getHealth() {
    const databaseUrl = process.env.DATABASE_URL
      || process.env.POSTGRES_PRISMA_URL
      || process.env.POSTGRES_URL
      || process.env.DATABASE_URL_UNPOOLED
      || process.env.NEON_DATABASE_URL
      || '';
    const databaseConfigured = /^postgres(?:ql)?:\/\//i.test(databaseUrl.trim());
    return {
      success: true,
      data: {
        status: 'ok',
        runtime: process.env.VERCEL ? 'vercel' : 'unknown',
        databaseConfigured,
      },
    };
  }

  @Get('health/appwrite')
  @ApiOperation({ summary: 'Connectivité Appwrite sans données sensibles' })
  @ApiResponse({ status: 200, description: 'État de la base et du stockage Appwrite' })
  async getAppwriteHealth() {
    return this.appwriteService.status();
  }

  @Get('admin')
  @ApiOperation({ summary: 'Redirection vers l\'Interface d\'Administration' })
  redirectAdmin(@Res() res: any) {
    return res.redirect('/admin-tool-ui/');
  }

  @Get('docs')
  @ApiOperation({ summary: 'Redirection vers la documentation Swagger API' })
  redirectDocs(@Res() res: any) {
    return res.redirect('/api/docs');
  }

  @Get('favicon.ico')
  @ApiOperation({ summary: 'Favicon' })
  getFavicon(@Res() res: any) {
    return res.status(204).end();
  }
}
