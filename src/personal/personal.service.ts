import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PersonalService {
  constructor(private prisma: PrismaService) {}

  private async requireUserId(userId?: string): Promise<string> {
    if (!userId) {
      throw new UnauthorizedException('Une session JWT est requise pour accéder aux données personnelles.');
    }
    const user = await this.prisma.personalUser.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Compte personnel introuvable ou désactivé.');
    }
    return user.id;
  }

  // --- MATIÈRES / COURS ---
  async getSubjects(userId?: string) {
    const targetUserId = await this.requireUserId(userId);
    const subjects = await this.prisma.personalSubject.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
    });

    return subjects.map((sub) => ({
      id: sub.id,
      code: sub.code,
      name: sub.name,
      title: sub.name,
      instructorName: sub.instructorName,
      instructor: sub.instructorName,
      credits: sub.credits ?? undefined,
      colorHex: sub.colorHex ?? undefined,
      classroom: sub.semesterLabel ?? undefined,
      semesterLabel: sub.semesterLabel ?? undefined,
      createdAt: sub.createdAt,
    }));
  }

  async getSubjectById(id: string, userId?: string) {
    const targetUserId = await this.requireUserId(userId);
    const sub = await this.prisma.personalSubject.findFirst({
      where: { id, userId: targetUserId },
    });
    if (!sub) {
      throw new NotFoundException(`Matière introuvable : ${id}`);
    }
    return {
      id: sub.id,
      code: sub.code,
      name: sub.name,
      title: sub.name,
      instructorName: sub.instructorName,
      instructor: sub.instructorName,
      credits: sub.credits ?? undefined,
      colorHex: sub.colorHex ?? undefined,
      classroom: sub.semesterLabel ?? undefined,
      semesterLabel: sub.semesterLabel ?? undefined,
      createdAt: sub.createdAt,
    };
  }

  async createSubject(dto: any, userId?: string) {
    const targetUserId = await this.requireUserId(userId);
    const name = dto.name || dto.title;
    const code = dto.code;
    if (!name || !code) {
      throw new BadRequestException('Le code et le nom du cours sont obligatoires.');
    }
    const instructorName = dto.instructorName ?? dto.instructor ?? null;

    const sub = await this.prisma.personalSubject.create({
      data: {
        userId: targetUserId,
        code,
        name,
        instructorName,
        credits: dto.credits !== undefined ? Number(dto.credits) : undefined,
        colorHex: dto.colorHex ?? undefined,
        semesterLabel: dto.classroom ?? dto.semesterLabel ?? undefined,
      },
    });

    return {
      id: sub.id,
      code: sub.code,
      name: sub.name,
      title: sub.name,
      instructorName: sub.instructorName,
      instructor: sub.instructorName,
      credits: sub.credits,
      colorHex: sub.colorHex,
      classroom: sub.semesterLabel,
      createdAt: sub.createdAt,
    };
  }

  async updateSubject(id: string, dto: any, userId?: string) {
    const targetUserId = await this.requireUserId(userId);
    await this.getSubjectById(id, targetUserId);

    const dataToUpdate: any = {};
    if (dto.name || dto.title) dataToUpdate.name = dto.name || dto.title;
    if (dto.code) dataToUpdate.code = dto.code;
    if (dto.instructorName || dto.instructor)
      dataToUpdate.instructorName = dto.instructorName || dto.instructor;
    if (dto.credits !== undefined) dataToUpdate.credits = Number(dto.credits);
    if (dto.colorHex) dataToUpdate.colorHex = dto.colorHex;
    if (dto.classroom || dto.semesterLabel)
      dataToUpdate.semesterLabel = dto.classroom || dto.semesterLabel;

    const sub = await this.prisma.personalSubject.update({
      where: { id },
      data: dataToUpdate,
    });

    return {
      id: sub.id,
      code: sub.code,
      name: sub.name,
      title: sub.name,
      instructorName: sub.instructorName,
      instructor: sub.instructorName,
      credits: sub.credits,
      colorHex: sub.colorHex,
      classroom: sub.semesterLabel,
      createdAt: sub.createdAt,
    };
  }

  async deleteSubject(id: string, userId?: string) {
    const targetUserId = await this.requireUserId(userId);
    await this.getSubjectById(id, targetUserId);
    await this.prisma.personalSubject.delete({ where: { id } });
    return { message: 'Cours/Matière supprimé(e) avec succès', id };
  }

  // --- EMPLOI DU TEMPS ---
  async getSchedules(userId?: string) {
    const targetUserId = await this.requireUserId(userId);
    const schedules = await this.prisma.personalSchedule.findMany({
      where: { userId: targetUserId },
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
    });

    return schedules.map((sch) => ({
      id: sch.id,
      courseId: sch.subjectId,
      subjectId: sch.subjectId,
      courseTitle: sch.subject?.name ?? undefined,
      courseCode: sch.subject?.code ?? undefined,
      dayOfWeek: sch.dayOfWeek,
      startTime: sch.startTime,
      endTime: sch.endTime,
      classroom: sch.classroomLocation ?? undefined,
      classroomLocation: sch.classroomLocation ?? undefined,
      colorHex: sch.subject?.colorHex ?? undefined,
      type: sch.notes ?? undefined,
      notes: sch.notes,
    }));
  }

  async createSchedule(dto: any, userId?: string) {
    const targetUserId = await this.requireUserId(userId);
    const subjectId = dto.subjectId || dto.courseId;
    if (!subjectId) {
      throw new BadRequestException('Une matière personnelle est obligatoire pour créer un créneau.');
    }
    const subject = await this.prisma.personalSubject.findFirst({ where: { id: subjectId, userId: targetUserId } });
    if (!subject) {
      throw new BadRequestException('La matière sélectionnée n’appartient pas à ce compte personnel.');
    }

    const dayOfWeek = dto.dayOfWeek?.toUpperCase();
    const startTime = dto.startTime;
    const endTime = dto.endTime;
    if (!dayOfWeek || !startTime || !endTime) {
      throw new BadRequestException('Le jour, l’heure de début et l’heure de fin sont obligatoires.');
    }
    const classroomLocation = dto.classroomLocation ?? dto.classroom ?? null;
    const notes = dto.type ?? dto.notes ?? null;

    const sch = await this.prisma.personalSchedule.create({
      data: {
        userId: targetUserId,
        subjectId,
        dayOfWeek,
        startTime,
        endTime,
        classroomLocation,
        notes,
      },
      include: { subject: true },
    });

    return {
      id: sch.id,
      courseId: sch.subjectId,
      subjectId: sch.subjectId,
      courseTitle: sch.subject?.name ?? undefined,
      courseCode: sch.subject?.code ?? undefined,
      dayOfWeek: sch.dayOfWeek,
      startTime: sch.startTime,
      endTime: sch.endTime,
      classroom: sch.classroomLocation,
      colorHex: sch.subject?.colorHex || '#2563eb',
      type: sch.notes || 'CM',
    };
  }

  async updateSchedule(id: string, dto: any, userId?: string) {
    const targetUserId = await this.requireUserId(userId);
    const existing = await this.prisma.personalSchedule.findFirst({
      where: { id, userId: targetUserId },
    });
    if (!existing) {
      throw new NotFoundException(`Créneau introuvable : ${id}`);
    }

    const dataToUpdate: any = {};
    if (dto.dayOfWeek) dataToUpdate.dayOfWeek = dto.dayOfWeek.toUpperCase();
    if (dto.startTime) dataToUpdate.startTime = dto.startTime;
    if (dto.endTime) dataToUpdate.endTime = dto.endTime;
    if (dto.classroom || dto.classroomLocation)
      dataToUpdate.classroomLocation = dto.classroom || dto.classroomLocation;
    if (dto.type || dto.notes) dataToUpdate.notes = dto.type || dto.notes;
    if (dto.courseId || dto.subjectId) {
      const subjectId = dto.courseId || dto.subjectId;
      const subject = await this.prisma.personalSubject.findFirst({ where: { id: subjectId, userId: targetUserId } });
      if (!subject) {
        throw new BadRequestException('La matière sélectionnée n’appartient pas à ce compte personnel.');
      }
      dataToUpdate.subjectId = subjectId;
    }
    if (Object.keys(dataToUpdate).length === 0) {
      throw new BadRequestException('Aucune donnée valide à mettre à jour.');
    }

    const sch = await this.prisma.personalSchedule.update({
      where: { id },
      data: dataToUpdate,
      include: { subject: true },
    });

    return {
      id: sch.id,
      courseId: sch.subjectId,
      subjectId: sch.subjectId,
      courseTitle: sch.subject?.name ?? undefined,
      courseCode: sch.subject?.code ?? undefined,
      dayOfWeek: sch.dayOfWeek,
      startTime: sch.startTime,
      endTime: sch.endTime,
      classroom: sch.classroomLocation,
      colorHex: sch.subject?.colorHex || '#2563eb',
      type: sch.notes || 'CM',
    };
  }

  async deleteSchedule(id: string, userId?: string) {
    const targetUserId = await this.requireUserId(userId);
    const existing = await this.prisma.personalSchedule.findFirst({
      where: { id, userId: targetUserId },
    });
    if (!existing) {
      throw new NotFoundException(`Créneau introuvable : ${id}`);
    }
    await this.prisma.personalSchedule.delete({ where: { id } });
    return { message: 'Créneau horaire retiré de l emploi du temps', id };
  }

  // --- NOTES & CALCULATOR ---
  async getGrades(userId?: string) {
    const targetUserId = await this.requireUserId(userId);
    const grades = await this.prisma.personalGrade.findMany({
      where: { userId: targetUserId },
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
    });

    return grades.map((g) => ({
      id: g.id,
      subjectId: g.subjectId,
      courseId: g.subjectId,
      courseTitle: g.subject?.name,
      evaluationTitle: g.evaluationTitle,
      title: g.evaluationTitle,
      score: Number(g.score),
      maxScore: Number(g.maxScore),
      coefficient: Number(g.coefficient),
      evaluationDate: g.evaluationDate,
    }));
  }

  async createGrade(dto: any, userId?: string) {
    const targetUserId = await this.requireUserId(userId);
    const subjectId = dto.subjectId || dto.courseId;
    if (!subjectId || !dto.evaluationTitle) {
      throw new BadRequestException('La matière et l’intitulé de l’évaluation sont obligatoires.');
    }
    const subject = await this.prisma.personalSubject.findFirst({ where: { id: subjectId, userId: targetUserId } });
    if (!subject) {
      throw new BadRequestException('La matière sélectionnée n’appartient pas à ce compte personnel.');
    }
    if (dto.score === undefined || !Number.isFinite(Number(dto.score))) {
      throw new BadRequestException('La note obtenue est obligatoire et doit être numérique.');
    }

    const g = await this.prisma.personalGrade.create({
      data: {
        userId: targetUserId,
        subjectId,
        evaluationTitle: dto.evaluationTitle,
        score: Number(dto.score),
        ...(dto.maxScore !== undefined ? { maxScore: Number(dto.maxScore) } : {}),
        ...(dto.coefficient !== undefined ? { coefficient: Number(dto.coefficient) } : {}),
        evaluationDate: dto.evaluationDate ? new Date(dto.evaluationDate) : null,
      },
      include: { subject: true },
    });

    return {
      id: g.id,
      subjectId: g.subjectId,
      courseId: g.subjectId,
      courseTitle: g.subject?.name,
      evaluationTitle: g.evaluationTitle,
      title: g.evaluationTitle,
      score: Number(g.score),
      maxScore: Number(g.maxScore),
      coefficient: Number(g.coefficient),
    };
  }

  async updateGrade(id: string, dto: any, userId?: string) {
    const targetUserId = await this.requireUserId(userId);
    const existing = await this.prisma.personalGrade.findFirst({
      where: { id, userId: targetUserId },
    });
    if (!existing) {
      throw new NotFoundException(`Note introuvable : ${id}`);
    }

    const dataToUpdate: any = {};
    if (dto.evaluationTitle || dto.title)
      dataToUpdate.evaluationTitle = dto.evaluationTitle || dto.title;
    if (dto.score !== undefined) dataToUpdate.score = Number(dto.score);
    if (dto.maxScore !== undefined) dataToUpdate.maxScore = Number(dto.maxScore);
    if (dto.coefficient !== undefined)
      dataToUpdate.coefficient = Number(dto.coefficient);
    if (dto.evaluationDate !== undefined)
      dataToUpdate.evaluationDate = dto.evaluationDate ? new Date(dto.evaluationDate) : null;
    if (Object.keys(dataToUpdate).length === 0) {
      throw new BadRequestException('Aucune donnée valide à mettre à jour.');
    }

    const g = await this.prisma.personalGrade.update({
      where: { id },
      data: dataToUpdate,
      include: { subject: true },
    });

    return {
      id: g.id,
      subjectId: g.subjectId,
      courseId: g.subjectId,
      courseTitle: g.subject?.name,
      evaluationTitle: g.evaluationTitle,
      score: Number(g.score),
      maxScore: Number(g.maxScore),
      coefficient: Number(g.coefficient),
    };
  }

  async deleteGrade(id: string, userId?: string) {
    const targetUserId = await this.requireUserId(userId);
    const existing = await this.prisma.personalGrade.findFirst({
      where: { id, userId: targetUserId },
    });
    if (!existing) {
      throw new NotFoundException(`Note introuvable : ${id}`);
    }
    await this.prisma.personalGrade.delete({ where: { id } });
    return { message: 'Note supprimée avec succès', id };
  }

  // --- TÂCHES & DEVOIRS ---
  async getTasks(userId?: string) {
    const targetUserId = await this.requireUserId(userId);
    const tasks = await this.prisma.personalTask.findMany({
      where: { userId: targetUserId },
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map((t) => ({
      id: t.id,
      courseId: t.subjectId,
      subjectId: t.subjectId,
      title: t.title,
      description: t.description,
      dueDate: t.dueDate,
      priority: t.priority,
      status: t.status,
      completed: t.status === 'COMPLETED',
      createdAt: t.createdAt,
    }));
  }

  async createTask(dto: any, userId?: string) {
    const targetUserId = await this.requireUserId(userId);
    const subjectId = dto.subjectId || dto.courseId;
    if (!dto.title) {
      throw new BadRequestException('Le titre du devoir est obligatoire.');
    }
    if (subjectId) {
      const subject = await this.prisma.personalSubject.findFirst({ where: { id: subjectId, userId: targetUserId } });
      if (!subject) {
        throw new BadRequestException('La matière sélectionnée n’appartient pas à ce compte personnel.');
      }
    }

    let priority = dto.priority || 'MEDIUM';
    if (typeof priority === 'string') priority = priority.toUpperCase();

    let status = dto.status || (dto.completed ? 'COMPLETED' : 'TODO');
    if (typeof status === 'string') status = status.toUpperCase();

    const t = await this.prisma.personalTask.create({
      data: {
        userId: targetUserId,
        subjectId,
        title: dto.title,
        description: dto.description || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        priority: priority as any,
        status: status as any,
      },
      include: { subject: true },
    });

    return {
      id: t.id,
      courseId: t.subjectId,
      subjectId: t.subjectId,
      title: t.title,
      description: t.description,
      dueDate: t.dueDate,
      priority: t.priority,
      status: t.status,
      completed: t.status === 'COMPLETED',
      createdAt: t.createdAt,
    };
  }

  async updateTask(id: string, dto: any, userId?: string) {
    const targetUserId = await this.requireUserId(userId);
    const existing = await this.prisma.personalTask.findFirst({
      where: { id, userId: targetUserId },
    });
    if (!existing) {
      throw new NotFoundException(`Tâche/Devoir introuvable : ${id}`);
    }

    const dataToUpdate: any = {};
    if (dto.title) dataToUpdate.title = dto.title;
    if (dto.description !== undefined) dataToUpdate.description = dto.description;
    if (dto.dueDate) dataToUpdate.dueDate = new Date(dto.dueDate);
    if (dto.priority) dataToUpdate.priority = dto.priority.toUpperCase();
    if (dto.status) dataToUpdate.status = dto.status.toUpperCase();
    if (dto.completed !== undefined) {
      dataToUpdate.status = dto.completed ? 'COMPLETED' : 'TODO';
    }
    if (dto.subjectId !== undefined || dto.courseId !== undefined) {
      const subjectId = dto.subjectId || dto.courseId || null;
      if (subjectId) {
        const subject = await this.prisma.personalSubject.findFirst({ where: { id: subjectId, userId: targetUserId } });
        if (!subject) throw new BadRequestException('La matière sélectionnée n’appartient pas à ce compte personnel.');
      }
      dataToUpdate.subjectId = subjectId;
    }
    if (Object.keys(dataToUpdate).length === 0) {
      throw new BadRequestException('Aucune donnée valide à mettre à jour.');
    }

    const t = await this.prisma.personalTask.update({
      where: { id },
      data: dataToUpdate,
      include: { subject: true },
    });

    return {
      id: t.id,
      courseId: t.subjectId,
      subjectId: t.subjectId,
      title: t.title,
      description: t.description,
      dueDate: t.dueDate,
      priority: t.priority,
      status: t.status,
      completed: t.status === 'COMPLETED',
      createdAt: t.createdAt,
    };
  }

  async deleteTask(id: string, userId?: string) {
    const targetUserId = await this.requireUserId(userId);
    const existing = await this.prisma.personalTask.findFirst({
      where: { id, userId: targetUserId },
    });
    if (!existing) {
      throw new NotFoundException(`Tâche/Devoir introuvable : ${id}`);
    }
    await this.prisma.personalTask.delete({ where: { id } });
    return { message: 'Devoir/Tâche supprimé(e) avec succès', id };
  }
}

