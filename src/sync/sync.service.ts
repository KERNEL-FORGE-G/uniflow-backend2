import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SyncOperationDto, SyncableEntity } from './dto/sync-push.dto';

export interface SyncResult {
  recordId: string;
  entity: SyncableEntity;
  status: 'applied' | 'conflict_resolved' | 'rejected';
  reason?: string;
}

interface SyncableRecord {
  id: string;
  updatedAt: Date;
}

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async push(operations: SyncOperationDto[]): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const op of operations) {
      try {
        const result = await this.applyOperation(op);
        results.push(result);
      } catch (error) {
        results.push({
          recordId: op.recordId,
          entity: op.entity,
          status: 'rejected',
          reason: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    return results;
  }

  private async applyOperation(op: SyncOperationDto): Promise<SyncResult> {
    if (op.operation === 'create') {
      await this.createRecord(op.entity, op.recordId, op.data);
      return { recordId: op.recordId, entity: op.entity, status: 'applied' };
    }

    if (op.operation === 'delete') {
      await this.softDeleteRecord(op.entity, op.recordId);
      return { recordId: op.recordId, entity: op.entity, status: 'applied' };
    }

    // operation === 'update' -> résolution de conflit Last-Write-Wins (§6.3 du CDC)
    const existing = await this.findRecord(op.entity, op.recordId);

    if (!existing) {
      await this.createRecord(op.entity, op.recordId, op.data);
      return { recordId: op.recordId, entity: op.entity, status: 'applied' };
    }

    const serverUpdatedAt = existing.updatedAt.getTime();
    const clientUpdatedAt = new Date(op.updatedAt).getTime();

    if (clientUpdatedAt >= serverUpdatedAt) {
      await this.updateRecord(op.entity, op.recordId, op.data);
      return { recordId: op.recordId, entity: op.entity, status: 'applied' };
    }

    return {
      recordId: op.recordId,
      entity: op.entity,
      status: 'conflict_resolved',
      reason: 'Le serveur avait une version plus récente (LWW)',
    };
  }

  private async findRecord(
    entity: SyncableEntity,
    id: string,
  ): Promise<SyncableRecord | null> {
    switch (entity) {
      case 'student':
        return this.prisma.student.findUnique({ where: { id } });
      case 'teacher':
        return this.prisma.teacher.findUnique({ where: { id } });
      case 'teachingUnit':
        return this.prisma.teachingUnit.findUnique({ where: { id } });
      case 'enrollment':
        return this.prisma.enrollment.findUnique({ where: { id } });
    }
  }

  private async createRecord(
    entity: SyncableEntity,
    id: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    switch (entity) {
      case 'student':
        await this.prisma.student.create({
          data: { id, ...data } as Prisma.StudentUncheckedCreateInput,
        });
        return;
      case 'teacher':
        await this.prisma.teacher.create({
          data: { id, ...data } as Prisma.TeacherUncheckedCreateInput,
        });
        return;
      case 'teachingUnit':
        await this.prisma.teachingUnit.create({
          data: { id, ...data } as Prisma.TeachingUnitUncheckedCreateInput,
        });
        return;
      case 'enrollment':
        await this.prisma.enrollment.create({
          data: { id, ...data } as Prisma.EnrollmentUncheckedCreateInput,
        });
        return;
    }
  }

  private async updateRecord(
    entity: SyncableEntity,
    id: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    switch (entity) {
      case 'student':
        await this.prisma.student.update({
          where: { id },
          data: data,
        });
        return;
      case 'teacher':
        await this.prisma.teacher.update({
          where: { id },
          data: data,
        });
        return;
      case 'teachingUnit':
        await this.prisma.teachingUnit.update({
          where: { id },
          data: data,
        });
        return;
      case 'enrollment':
        await this.prisma.enrollment.update({
          where: { id },
          data: data,
        });
        return;
    }
  }

  private async softDeleteRecord(
    entity: SyncableEntity,
    id: string,
  ): Promise<void> {
    const deletedAt = new Date();

    switch (entity) {
      case 'student':
        await this.prisma.student.update({
          where: { id },
          data: { deletedAt },
        });
        return;
      case 'teacher':
        await this.prisma.teacher.update({
          where: { id },
          data: { deletedAt },
        });
        return;
      case 'teachingUnit':
        await this.prisma.teachingUnit.update({
          where: { id },
          data: { deletedAt },
        });
        return;
      case 'enrollment':
        await this.prisma.enrollment.update({
          where: { id },
          data: { deletedAt },
        });
        return;
    }
  }

  async pull(since?: string) {
    const sinceDate = since ? new Date(since) : new Date(0);

    const [students, teachers, teachingUnits, enrollments] = await Promise.all([
      this.prisma.student.findMany({
        where: { updatedAt: { gt: sinceDate } },
      }),
      this.prisma.teacher.findMany({
        where: { updatedAt: { gt: sinceDate } },
      }),
      this.prisma.teachingUnit.findMany({
        where: { updatedAt: { gt: sinceDate } },
      }),
      this.prisma.enrollment.findMany({
        where: { updatedAt: { gt: sinceDate } },
      }),
    ]);

    return {
      serverTime: new Date().toISOString(),
      changes: {
        student: students,
        teacher: teachers,
        teachingUnit: teachingUnits,
        enrollment: enrollments,
      },
    };
  }
}
