import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { encrypt } from '../common/utils/encryption.util';
import { TABLE_CONFIG, TableConfig } from './table-config';

interface PrismaDelegate {
  findMany(args?: {
    where?: Record<string, unknown>;
    take?: number;
    skip?: number;
    orderBy?: Record<string, unknown>;
  }): Promise<Record<string, unknown>[]>;
  findUnique(args: {
    where: Record<string, unknown>;
  }): Promise<Record<string, unknown> | null>;
  count(args?: {
    where?: Record<string, unknown>;
  }): Promise<number>;
  create(args: {
    data: Record<string, unknown>;
  }): Promise<Record<string, unknown>>;
  update(args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }): Promise<Record<string, unknown>>;
  delete(args: {
    where: Record<string, unknown>;
  }): Promise<Record<string, unknown>>;
}

@Injectable()
export class AdminToolService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      usersCount,
      studentsCount,
      teachersCount,
      ueCount,
      coursesCount,
      classroomsCount,
      sessionsCount,
      notificationsCount,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }).catch(() => 0),
      this.prisma.student.count({ where: { deletedAt: null } }).catch(() => 0),
      this.prisma.teacher.count({ where: { deletedAt: null } }).catch(() => 0),
      this.prisma.teachingUnit.count({ where: { deletedAt: null } }).catch(() => 0),
      this.prisma.course.count({ where: { deletedAt: null } }).catch(() => 0),
      this.prisma.classroom.count({ where: { deletedAt: null } }).catch(() => 0),
      this.prisma.attendanceSession.count({ where: { deletedAt: null } }).catch(() => 0),
      this.prisma.notification.count({ where: { deletedAt: null } }).catch(() => 0),
    ]);

    return {
      usersCount,
      studentsCount,
      teachersCount,
      ueCount,
      coursesCount,
      classroomsCount,
      sessionsCount,
      notificationsCount,
    };
  }

  listTables() {
    return Object.entries(TABLE_CONFIG).map(([key, cfg]) => ({
      key,
      label: cfg.label,
      group: cfg.group,
    }));
  }

  async getFormSchema(tableKey: string) {
    const config = this.getConfig(tableKey);

    const fields = await Promise.all(
      config.fields.map(async (field) => {
        if (field.type === 'foreignKey' && field.foreignKey) {
          const options = await this.getOptions(field.foreignKey.table);
          return { ...field, options };
        }
        return field;
      }),
    );

    return { key: tableKey, label: config.label, fields };
  }

  async getData(
    tableKey: string,
    page = 1,
    pageSize = 15,
    search?: string,
  ) {
    const config = this.getConfig(tableKey);
    const delegate = this.getDelegate(config.model);

    const where: Record<string, unknown> = { deletedAt: null };

    if (search && search.trim() !== '') {
      const stringFields = config.fields.filter(
        (f) => f.type === 'string' || f.type === 'text',
      );
      if (stringFields.length > 0) {
        where['OR'] = stringFields.map((f) => ({
          [f.name]: { contains: search.trim(), mode: 'insensitive' },
        }));
      }
    }

    const skip = (page - 1) * pageSize;

    const [total, records] = await Promise.all([
      delegate.count ? delegate.count({ where }).catch(() => 0) : 0,
      delegate.findMany({
        where,
        take: pageSize,
        skip,
        orderBy: { createdAt: 'desc' },
      }).catch(async () => {
        return delegate.findMany({
          take: pageSize,
          skip,
        }).catch(() => []);
      }),
    ]);

    return {
      tableKey,
      label: config.label,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
      records,
    };
  }

  async getOne(tableKey: string, id: string) {
    const config = this.getConfig(tableKey);
    const delegate = this.getDelegate(config.model);
    const record = await delegate.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`Enregistrement #${id} introuvable dans ${config.label}`);
    return record;
  }

  private async getOptions(
    tableKey: string,
  ): Promise<{ value: unknown; label: string }[]> {
    const config = this.getConfig(tableKey);
    const delegate = this.getDelegate(config.model);
    const records = await delegate.findMany({
      where: { deletedAt: null },
      take: 500,
      orderBy: { createdAt: 'desc' },
    }).catch(() => []);
    return records.map((r) => ({
      value: r['id'],
      label: config.getLabel(r),
    }));
  }

  async insert(tableKey: string, rawData: Record<string, unknown>) {
    const config = this.getConfig(tableKey);
    const delegate = this.getDelegate(config.model);
    const payload: Record<string, unknown> = { ...rawData };

    Object.keys(payload).forEach((key) => {
      if (
        payload[key] === '' ||
        payload[key] === undefined ||
        payload[key] === null
      ) {
        delete payload[key];
      }
    });

    for (const field of config.fields) {
      if (payload[field.name] === undefined) continue;
      const val = payload[field.name];
      if (field.type === 'int') {
        payload[field.name] =
          typeof val === 'number' ? val : parseInt(val as string, 10);
      }
      if (field.type === 'boolean') {
        payload[field.name] = val === true || val === 'true';
      }
      if (field.type === 'date' || field.type === 'datetime') {
        payload[field.name] = new Date(val as string | number | Date);
      }
    }

    if (config.specialHandling === 'hashPassword') {
      if (typeof payload.password !== 'string' || !payload.password) {
        throw new BadRequestException('Le mot de passe est requis');
      }
      payload.passwordHash = await bcrypt.hash(payload.password, 12);
      delete payload.password;
    }
    if (config.specialHandling === 'encryptSecret') {
      if (typeof payload.apiSecret !== 'string' || !payload.apiSecret) {
        throw new BadRequestException('Le secret API est requis');
      }
      payload.apiSecretEncrypted = encrypt(payload.apiSecret);
      delete payload.apiSecret;
    }

    try {
      const record = await delegate.create({ data: payload });
      return { success: true, record };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Échec de l'insertion : ${message}`);
    }
  }

  async update(
    tableKey: string,
    id: string,
    rawData: Record<string, unknown>,
  ) {
    const config = this.getConfig(tableKey);
    const delegate = this.getDelegate(config.model);
    const payload: Record<string, unknown> = { ...rawData };

    delete payload.id;
    delete payload.createdAt;
    delete payload.updatedAt;

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    for (const field of config.fields) {
      if (payload[field.name] === undefined) continue;
      const val = payload[field.name];
      if (val === '') {
        delete payload[field.name];
        continue;
      }
      if (field.type === 'int') {
        payload[field.name] =
          typeof val === 'number' ? val : parseInt(val as string, 10);
      }
      if (field.type === 'boolean') {
        payload[field.name] = val === true || val === 'true';
      }
      if (field.type === 'date' || field.type === 'datetime') {
        payload[field.name] = new Date(val as string | number | Date);
      }
    }

    if (config.specialHandling === 'hashPassword' && payload.password) {
      if (typeof payload.password === 'string' && payload.password.trim().length > 0) {
        payload.passwordHash = await bcrypt.hash(payload.password, 12);
      }
      delete payload.password;
    }
    if (config.specialHandling === 'encryptSecret' && payload.apiSecret) {
      if (typeof payload.apiSecret === 'string' && payload.apiSecret.trim().length > 0) {
        payload.apiSecretEncrypted = encrypt(payload.apiSecret);
      }
      delete payload.apiSecret;
    }

    try {
      const record = await delegate.update({
        where: { id },
        data: payload,
      });
      return { success: true, record };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Échec de la mise à jour : ${message}`);
    }
  }

  async delete(tableKey: string, id: string) {
    const config = this.getConfig(tableKey);
    const delegate = this.getDelegate(config.model);
    try {
      // Tenter un soft delete d'abord s'il existe deletedAt
      try {
        const record = await delegate.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
        return { success: true, record };
      } catch {
        const record = await delegate.delete({ where: { id } });
        return { success: true, record };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Échec de la suppression : ${message}`);
    }
  }

  private getConfig(tableKey: string): TableConfig {
    const config = TABLE_CONFIG[tableKey];
    if (!config) throw new NotFoundException(`Table "${tableKey}" inconnue`);
    return config;
  }

  private getDelegate(modelName: string): PrismaDelegate {
    return (this.prisma as unknown as Record<string, PrismaDelegate>)[
      modelName
    ];
  }
}
