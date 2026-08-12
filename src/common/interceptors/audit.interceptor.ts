import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import { UserRole } from '@prisma/client';

interface RequestWithUser extends Request {
  user?: {
    id?: string;
    userId?: string;
    role?: UserRole;
  };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithUser>();
    const response = http.getResponse<Response>();
    const method = request.method;

    // Mutating HTTP methods to audit
    const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (!isMutating) {
      return next.handle();
    }

    const url = request.url || '';
    const user = request.user;
    const ip =
      request.ip ||
      (typeof request.headers['x-forwarded-for'] === 'string'
        ? request.headers['x-forwarded-for']
        : request.socket.remoteAddress);
    const userAgent = request.headers['user-agent'];

    // Derive action and resource from URL & method
    const urlParts = url.split('?')[0].split('/').filter(Boolean);
    const resource = urlParts[0] || 'global';
    const resourceId =
      urlParts.length > 1 ? urlParts[urlParts.length - 1] : undefined;
    const action = `${method}_${resource.toUpperCase()}`;

    // Clean body to avoid storing passwords or sensitive tokens
    const rawBody =
      request.body && typeof request.body === 'object'
        ? (request.body as Record<string, any>)
        : {};
    const body: Record<string, any> = { ...rawBody };
    delete body.password;
    delete body.refreshToken;
    delete body.apiSecret;

    return next.handle().pipe(
      tap({
        next: () => {
          void this.auditLogsService.log({
            userId: user?.id || user?.userId,
            userRole: user?.role,
            action,
            resource,
            resourceId,
            ipAddress: ip,
            userAgent,
            statusCode: response.statusCode,
            details: body,
          });
        },
        error: (err: { status?: number; message?: string }) => {
          void this.auditLogsService.log({
            userId: user?.id || user?.userId,
            userRole: user?.role,
            action: `${action}_FAILED`,
            resource,
            resourceId,
            ipAddress: ip,
            userAgent,
            statusCode: err.status || 500,
            details: { error: err.message ?? 'Unknown error', body },
          });
        },
      }),
    );
  }
}
