import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUeDto } from './dto/create-ue.dto';
import { UpdateUeDto } from './dto/update-ue.dto';

@Injectable()
export class UeService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUeDto) {
    const existingUe = await this.prisma.teachingUnit.findUnique({
      where: { code: dto.code },
    });

    if (existingUe) {
      throw new ConflictException('Une UE avec ce code existe déjà');
    }

    const { specialtyIds, ...ueData } = dto;

    const ue = await this.prisma.teachingUnit.create({
      data: {
        ...ueData,
        specialties: specialtyIds
          ? {
              create: specialtyIds.map((specialtyId) => ({
                specialty: { connect: { id: specialtyId } },
              })),
            }
          : undefined,
      },
      include: {
        level: true,
        semester: true,
        specialties: { include: { specialty: true } },
      },
    });

    return ue;
  }

  async findAll(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.teachingUnit.findMany({
        skip,
        take: pageSize,
        where: { deletedAt: null },
        include: {
          level: true,
          semester: true,
          specialties: { include: { specialty: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.teachingUnit.count({ where: { deletedAt: null } }),
    ]);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const ue = await this.prisma.teachingUnit.findUnique({
      where: { id },
      include: {
        level: true,
        semester: true,
        specialties: { include: { specialty: true } },
      },
    });

    if (!ue || ue.deletedAt) {
      throw new NotFoundException('UE introuvable');
    }

    return ue;
  }

  async findByLevel(levelId: string) {
    return this.prisma.teachingUnit.findMany({
      where: { levelId, deletedAt: null },
      include: { semester: true },
    });
  }

  async findBySemester(semesterId: string) {
    return this.prisma.teachingUnit.findMany({
      where: { semesterId, deletedAt: null },
      include: { level: true },
    });
  }

  async update(id: string, dto: UpdateUeDto) {
    await this.findOne(id);

    const { specialtyIds, ...ueData } = dto;

    if (specialtyIds) {
      // Rotation propre des spécialités : on supprime les anciennes liaisons
      // puis on recrée celles fournies, plutôt que de tenter une fusion partielle.
      await this.prisma.ueSpecialty.deleteMany({
        where: { teachingUnitId: id },
      });
    }

    return this.prisma.teachingUnit.update({
      where: { id },
      data: {
        ...ueData,
        specialties: specialtyIds
          ? {
              create: specialtyIds.map((specialtyId) => ({
                specialty: { connect: { id: specialtyId } },
              })),
            }
          : undefined,
      },
      include: {
        level: true,
        semester: true,
        specialties: { include: { specialty: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.teachingUnit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
