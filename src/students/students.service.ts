import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: 'ETUDIANT',
      },
    });

    const student = await this.prisma.student.create({
      data: {
        userId: user.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        matricule: await this.generateMatricule(),
        status: dto.status ?? 'ACTIVE',
        levelId: dto.levelId,
        specialtyId: dto.specialtyId,
      },
      include: { user: { select: { email: true, role: true } } },
    });

    return student;
  }

  async findAll(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.student.findMany({
        skip,
        take: pageSize,
        where: { deletedAt: null },
        include: { user: { select: { email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.student.count({ where: { deletedAt: null } }),
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
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: { select: { email: true, role: true } } },
    });

    if (!student || student.deletedAt) {
      throw new NotFoundException('Étudiant introuvable');
    }

    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id); // vérifie l'existence, lève 404 sinon

    return this.prisma.student.update({
      where: { id },
      data: dto,
      include: { user: { select: { email: true, role: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Suppression douce (soft delete) - §8.3 du CDC
    return this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async generateMatricule(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.student.count();
    return `UY1-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}
