import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface HttpExceptionResponse {
  message?: string | string[];
  [key: string]: unknown;
}

function isDatabaseFailure(exception: unknown): boolean {
  if (!(exception instanceof Error)) return false;
  const name = exception.name.toLowerCase();
  const message = exception.message.toLowerCase();
  return name.includes('prisma')
    || message.includes('database')
    || message.includes('connection')
    || message.includes('relation')
    || message.includes('postgres')
    || message.includes('neon');
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const databaseFailure = isDatabaseFailure(exception);
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : databaseFailure
        ? HttpStatus.SERVICE_UNAVAILABLE
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = databaseFailure
      ? 'La base de données est temporairement indisponible. Vérifiez la connexion Neon du backend puis réessayez.'
      : 'Erreur interne du serveur.';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : ((exceptionResponse as HttpExceptionResponse).message ?? exception.message);
    }

    response.status(status).json({
      success: false,
      error: {
        code: status,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
