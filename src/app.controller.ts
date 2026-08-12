import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AppService } from './app.service';

@ApiTags('00 - Système & Santé')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Vérification de l\'état de l\'API (Health Check)' })
  @ApiResponse({ status: 200, description: 'L\'API est opérationnelle' })
  getHello(): string {
    return this.appService.getHello();
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
