import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, Prisma } from '@prisma/client';

export interface CreateAuditLogDto {
  userId?: string;
  userRole?: UserRole;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  statusCode?: number;
  details?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          userId: dto.userId,
          userRole: dto.userRole,
          action: dto.action,
          resource: dto.resource,
          resourceId: dto.resourceId,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
          statusCode: dto.statusCode,
          details:
            dto.details !== undefined
              ? (dto.details as Prisma.InputJsonObject)
              : Prisma.JsonNull,
        },
      });
    } catch (error) {
      // Log error without crashing main HTTP cycle
      console.error('Audit logging error:', error);
    }
  }

  async findAll(page = 1, limit = 50, resource?: string, userId?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.AuditLogWhereInput = {};

    if (resource) {
      where.resource = resource;
    }
    if (userId) {
      where.userId = userId;
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
    });
  }
}
