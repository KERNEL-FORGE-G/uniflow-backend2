import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTeacherDto) {
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
        role: 'ENSEIGNANT',
      },
    });

    const teacher = await this.prisma.teacher.create({
      data: {
        userId: user.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      include: { user: { select: { email: true, role: true } } },
    });

    return teacher;
  }

  async findAll(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.teacher.findMany({
        skip,
        take: pageSize,
        where: { deletedAt: null },
        include: { user: { select: { email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.teacher.count({ where: { deletedAt: null } }),
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
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: { user: { select: { email: true, role: true } } },
    });

    if (!teacher || teacher.deletedAt) {
      throw new NotFoundException('Enseignant introuvable');
    }

    return teacher;
  }

  async update(id: string, dto: UpdateTeacherDto) {
    await this.findOne(id);

    return this.prisma.teacher.update({
      where: { id },
      data: dto,
      include: { user: { select: { email: true, role: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.teacher.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
