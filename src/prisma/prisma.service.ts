import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function resolveDatabaseUrl(): string {
  return process.env.DATABASE_URL
    || process.env.POSTGRES_PRISMA_URL
    || process.env.POSTGRES_URL
    || process.env.DATABASE_URL_UNPOOLED
    || process.env.NEON_DATABASE_URL
    || '';
}

export function formatDatabaseUrl(rawUrl: string = ''): string {
  if (!rawUrl) return rawUrl;

  let url = rawUrl.trim();

  // Convert http:// or https:// to postgresql://
  if (url.startsWith('http://') || url.startsWith('https://')) {
    url = url.replace(/^https?:\/\//i, 'postgresql://');
  }

  // Remove .apirest.c-X or .apirest suffix from domain name
  url = url.replace(/\.apirest(\.c-\d+)?/gi, '');

  // Remove trailing /rest/v1 or /rest/... paths
  url = url.replace(/\/rest(\/v\d+)?\/?$/i, '');

  // Ensure sslmode=require parameter for Neon
  if (url.includes('neon.tech') && !url.includes('sslmode=')) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}sslmode=require`;
  }

  return url;
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const databaseUrl = formatDatabaseUrl(resolveDatabaseUrl());
    super({
      datasources: databaseUrl
        ? {
            db: {
              url: databaseUrl,
            },
          }
        : undefined,
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error: any) {
      this.logger.error(`Database connection error: ${error.message}`);
      this.logger.warn(
        '💡 Ensure DATABASE_URL is a valid PostgreSQL string with credentials, e.g.: postgresql://neondb_owner:password@ep-patient-scene-aylk2z8t.us-east-2.aws.neon.tech/neondb?sslmode=require',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

