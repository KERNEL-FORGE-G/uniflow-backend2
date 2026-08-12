import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEnrollmentDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });

    if (!student || student.deletedAt) {
      throw new NotFoundException('Étudiant introuvable');
    }

    const teachingUnit = await this.prisma.teachingUnit.findUnique({
      where: { id: dto.teachingUnitId },
    });

    if (!teachingUnit || teachingUnit.deletedAt) {
      throw new NotFoundException('UE introuvable');
    }

    // Règle métier §4.7 du CDC : un étudiant ne peut s'inscrire qu'à des UE
    // de son propre niveau.
    if (teachingUnit.levelId !== student.levelId) {
      throw new BadRequestException(
        "Cette UE n'appartient pas au niveau de l'étudiant",
      );
    }

    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_teachingUnitId: {
          studentId: dto.studentId,
          teachingUnitId: dto.teachingUnitId,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('Cet étudiant est déjà inscrit à cette UE');
    }

    // Les UE optionnelles nécessitent une validation du secrétariat (§4.7 du CDC)
    // -> statut PENDING par défaut ; les UE obligatoires sont auto-validées.
    const status =
      teachingUnit.type === 'OBLIGATOIRE' ? 'VALIDATED' : 'PENDING';

    return this.prisma.enrollment.create({
      data: {
        studentId: dto.studentId,
        teachingUnitId: dto.teachingUnitId,
        status,
      },
      include: {
        student: {
          select: { firstName: true, lastName: true, matricule: true },
        },
        teachingUnit: { select: { code: true, name: true, type: true } },
      },
    });
  }

  async findAll(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        skip,
        take: pageSize,
        where: { deletedAt: null },
        include: {
          student: {
            select: { firstName: true, lastName: true, matricule: true },
          },
          teachingUnit: { select: { code: true, name: true, type: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where: { deletedAt: null } }),
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
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: {
          select: { firstName: true, lastName: true, matricule: true },
        },
        teachingUnit: { select: { code: true, name: true, type: true } },
      },
    });

    if (!enrollment || enrollment.deletedAt) {
      throw new NotFoundException('Inscription introuvable');
    }

    return enrollment;
  }

  async findByStudent(studentId: string) {
    return this.prisma.enrollment.findMany({
      where: { studentId, deletedAt: null },
      include: {
        teachingUnit: {
          select: { code: true, name: true, type: true, credits: true },
        },
      },
    });
  }

  async findByTeachingUnit(teachingUnitId: string) {
    return this.prisma.enrollment.findMany({
      where: { teachingUnitId, deletedAt: null },
      include: {
        student: {
          select: { firstName: true, lastName: true, matricule: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateEnrollmentDto) {
    await this.findOne(id);

    return this.prisma.enrollment.update({
      where: { id },
      data: { status: dto.status },
      include: {
        student: {
          select: { firstName: true, lastName: true, matricule: true },
        },
        teachingUnit: { select: { code: true, name: true, type: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.enrollment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
