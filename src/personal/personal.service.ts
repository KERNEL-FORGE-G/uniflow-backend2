import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonalSubjectDto } from './dto/create-personal-subject.dto';
import { CreatePersonalScheduleDto } from './dto/create-personal-schedule.dto';
import { CreatePersonalGradeDto } from './dto/create-personal-grade.dto';
import { CreatePersonalTaskDto } from './dto/create-personal-task.dto';

@Injectable()
export class PersonalService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateUserId(userId?: string): Promise<string> {
    if (userId) return userId;

    let user = await this.prisma.personalUser.findFirst();
    if (!user) {
      user = await this.prisma.personalUser.create({
        data: {
          id: 'pusr_cm_1',
          email: 'jean.independant@gmail.com',
          passwordHash: 'hashed_pwd',
          firstName: 'Jean',
          lastName: 'Nguea',
          countryCode: 'CM',
          preferredCurrency: 'XAF',
        },
      });
    }
    return user.id;
  }

  // --- MATIÈRES ---
  async getSubjects(userId?: string) {
    const targetUserId = await this.getOrCreateUserId(userId);
    return this.prisma.personalSubject.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSubject(dto: CreatePersonalSubjectDto, userId?: string) {
    const targetUserId = await this.getOrCreateUserId(userId);
    return this.prisma.personalSubject.create({
      data: {
        userId: targetUserId,
        code: dto.code,
        name: dto.name,
        instructorName: dto.instructorName,
        credits: dto.credits ?? 3,
        colorHex: dto.colorHex ?? '#10b981',
        semesterLabel: dto.semesterLabel ?? 'Semestre 1',
      },
    });
  }

  // --- EMPLOI DU TEMPS ---
  async getSchedules(userId?: string) {
    const targetUserId = await this.getOrCreateUserId(userId);
    return this.prisma.personalSchedule.findMany({
      where: { userId: targetUserId },
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSchedule(dto: CreatePersonalScheduleDto, userId?: string) {
    const targetUserId = await this.getOrCreateUserId(userId);

    const subject = await this.prisma.personalSubject.findFirst({
      where: { id: dto.subjectId, userId: targetUserId },
    });

    if (!subject) {
      // Fallback: search by id or create subject if subjectId not found
      const anySubject = await this.prisma.personalSubject.findUnique({
        where: { id: dto.subjectId },
      });
      if (!anySubject) {
        throw new NotFoundException(`Matière introuvable avec l ID: ${dto.subjectId}`);
      }
    }

    return this.prisma.personalSchedule.create({
      data: {
        userId: targetUserId,
        subjectId: dto.subjectId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        classroomLocation: dto.classroomLocation,
        notes: dto.notes,
      },
    });
  }

  // --- NOTES & CALCULATOR ---
  async getGrades(userId?: string) {
    const targetUserId = await this.getOrCreateUserId(userId);
    return this.prisma.personalGrade.findMany({
      where: { userId: targetUserId },
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGrade(dto: CreatePersonalGradeDto, userId?: string) {
    const targetUserId = await this.getOrCreateUserId(userId);

    return this.prisma.personalGrade.create({
      data: {
        userId: targetUserId,
        subjectId: dto.subjectId,
        evaluationTitle: dto.evaluationTitle,
        score: dto.score,
        maxScore: dto.maxScore ?? 20.0,
        coefficient: dto.coefficient ?? 1.0,
        evaluationDate: dto.evaluationDate ? new Date(dto.evaluationDate) : null,
      },
    });
  }

  // --- TÂCHES ---
  async getTasks(userId?: string) {
    const targetUserId = await this.getOrCreateUserId(userId);
    return this.prisma.personalTask.findMany({
      where: { userId: targetUserId },
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTask(dto: CreatePersonalTaskDto, userId?: string) {
    const targetUserId = await this.getOrCreateUserId(userId);
    return this.prisma.personalTask.create({
      data: {
        userId: targetUserId,
        subjectId: dto.subjectId || null,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        priority: dto.priority,
        status: dto.status,
      },
    });
  }
}
