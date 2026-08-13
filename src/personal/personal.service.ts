import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  // --- MATIÈRES / COURS ---
  async getSubjects(userId?: string) {
    const targetUserId = await this.getOrCreateUserId(userId);
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
      credits: sub.credits ?? 3,
      colorHex: sub.colorHex || '#10b981',
      classroom: sub.semesterLabel || 'Salle A',
      semesterLabel: sub.semesterLabel || 'Semestre 1',
      createdAt: sub.createdAt,
    }));
  }

  async getSubjectById(id: string, userId?: string) {
    const targetUserId = await this.getOrCreateUserId(userId);
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
      credits: sub.credits ?? 3,
      colorHex: sub.colorHex || '#10b981',
      classroom: sub.semesterLabel || 'Salle A',
      createdAt: sub.createdAt,
    };
  }

  async createSubject(dto: any, userId?: string) {
    const targetUserId = await this.getOrCreateUserId(userId);
    const name = dto.name || dto.title || 'Matière Sans Titre';
    const instructorName = dto.instructorName || dto.instructor || 'Enseignant Inconnu';
    const code = dto.code || `MAT${Math.floor(100 + Math.random() * 900)}`;

    const sub = await this.prisma.personalSubject.create({
      data: {
        userId: targetUserId,
        code,
        name,
        instructorName,
        credits: dto.credits ? Number(dto.credits) : 3,
        colorHex: dto.colorHex || '#10b981',
        semesterLabel: dto.classroom || dto.semesterLabel || 'Semestre 1',
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
    const targetUserId = await this.getOrCreateUserId(userId);
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
    const targetUserId = await this.getOrCreateUserId(userId);
    await this.getSubjectById(id, targetUserId);
    await this.prisma.personalSubject.delete({ where: { id } });
    return { message: 'Cours/Matière supprimé(e) avec succès', id };
  }

  // --- EMPLOI DU TEMPS ---
  async getSchedules(userId?: string) {
    const targetUserId = await this.getOrCreateUserId(userId);
    const schedules = await this.prisma.personalSchedule.findMany({
      where: { userId: targetUserId },
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
    });

    return schedules.map((sch) => ({
      id: sch.id,
      courseId: sch.subjectId,
      subjectId: sch.subjectId,
      courseTitle: sch.subject?.name || 'Matière',
      courseCode: sch.subject?.code || 'INF101',
      dayOfWeek: sch.dayOfWeek,
      startTime: sch.startTime,
      endTime: sch.endTime,
      classroom: sch.classroomLocation || 'Amphi A',
      classroomLocation: sch.classroomLocation || 'Amphi A',
      colorHex: sch.subject?.colorHex || '#2563eb',
      type: sch.notes || 'CM',
      notes: sch.notes,
    }));
  }

  async createSchedule(dto: any, userId?: string) {
    const targetUserId = await this.getOrCreateUserId(userId);
    let subjectId = dto.subjectId || dto.courseId;

    if (!subjectId) {
      let firstSubject = await this.prisma.personalSubject.findFirst({
        where: { userId: targetUserId },
      });
      if (!firstSubject) {
        firstSubject = await this.prisma.personalSubject.create({
          data: {
            userId: targetUserId,
            code: 'INF201',
            name: dto.courseTitle || 'Algorithmique',
            credits: 4,
            colorHex: dto.colorHex || '#2563eb',
          },
        });
      }
      subjectId = firstSubject.id;
    }

    const dayOfWeek = (dto.dayOfWeek || 'LUNDI').toUpperCase();
    const startTime = dto.startTime || '08:00';
    const endTime = dto.endTime || '10:00';
    const classroomLocation = dto.classroomLocation || dto.classroom || 'Amphi 350';
    const notes = dto.type || dto.notes || 'CM';

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
      courseTitle: sch.subject?.name || 'Matière',
      courseCode: sch.subject?.code || 'INF101',
      dayOfWeek: sch.dayOfWeek,
      startTime: sch.startTime,
      endTime: sch.endTime,
      classroom: sch.classroomLocation,
      colorHex: sch.subject?.colorHex || '#2563eb',
      type: sch.notes || 'CM',
    };
  }

  async updateSchedule(id: string, dto: any, userId?: string) {
    const targetUserId = await this.getOrCreateUserId(userId);
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
    if (dto.courseId || dto.subjectId)
      dataToUpdate.subjectId = dto.courseId || dto.subjectId;

    const sch = await this.prisma.personalSchedule.update({
      where: { id },
      data: dataToUpdate,
      include: { subject: true },
    });

    return {
      id: sch.id,
      courseId: sch.subjectId,
      subjectId: sch.subjectId,
      courseTitle: sch.subject?.name || 'Matière',
      courseCode: sch.subject?.code || 'INF101',
      dayOfWeek: sch.dayOfWeek,
      startTime: sch.startTime,
      endTime: sch.endTime,
      classroom: sch.classroomLocation,
      colorHex: sch.subject?.colorHex || '#2563eb',
      type: sch.notes || 'CM',
    };
  }

  async deleteSchedule(id: string, userId?: string) {
    const targetUserId = await this.getOrCreateUserId(userId);
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
    const targetUserId = await this.getOrCreateUserId(userId);
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
    const targetUserId = await this.getOrCreateUserId(userId);
    let subjectId = dto.subjectId || dto.courseId;

    if (!subjectId) {
      let firstSubject = await this.prisma.personalSubject.findFirst({
        where: { userId: targetUserId },
      });
      if (!firstSubject) {
        firstSubject = await this.prisma.personalSubject.create({
          data: {
            userId: targetUserId,
            code: 'INF101',
            name: 'Matière Générale',
            credits: 3,
          },
        });
      }
      subjectId = firstSubject.id;
    }

    const g = await this.prisma.personalGrade.create({
      data: {
        userId: targetUserId,
        subjectId,
        evaluationTitle: dto.evaluationTitle || dto.title || 'Évaluation',
        score: dto.score ? Number(dto.score) : 10.0,
        maxScore: dto.maxScore ? Number(dto.maxScore) : 20.0,
        coefficient: dto.coefficient ? Number(dto.coefficient) : 1.0,
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
    const targetUserId = await this.getOrCreateUserId(userId);
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
    const targetUserId = await this.getOrCreateUserId(userId);
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
    const targetUserId = await this.getOrCreateUserId(userId);
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
    const targetUserId = await this.getOrCreateUserId(userId);
    const subjectId = dto.subjectId || dto.courseId || null;

    let priority = dto.priority || 'MEDIUM';
    if (typeof priority === 'string') priority = priority.toUpperCase();

    let status = dto.status || (dto.completed ? 'COMPLETED' : 'TODO');
    if (typeof status === 'string') status = status.toUpperCase();

    const t = await this.prisma.personalTask.create({
      data: {
        userId: targetUserId,
        subjectId,
        title: dto.title || 'Devoir',
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
    const targetUserId = await this.getOrCreateUserId(userId);
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
    const targetUserId = await this.getOrCreateUserId(userId);
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

