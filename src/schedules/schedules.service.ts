// src/schedules/schedules.service.ts
//
// Cœur du risque métier du module : vérifier qu'un créneau (jour + heures)
// ne crée pas de double affectation de salle OU d'enseignant (§4.7 du CDC).
// Contient aussi la génération automatique de créneaux (§10.2 du CDC),
// via un algorithme glouton simple — voir commentaire sur generate().

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { GenerateSchedulesDto } from './dto/generate-schedules.dto';
import { DayOfWeek } from '@prisma/client';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  // Créneaux candidats : 8h-18h30, tranches d'1h30, du lundi au samedi.
  // Volontairement simple — un vrai générateur tiendrait compte des pauses,
  // des préférences enseignants, etc. Documenté comme simplification assumée.
  private readonly CANDIDATE_SLOTS: { start: string; end: string }[] = [
    { start: '08:00', end: '09:30' },
    { start: '09:30', end: '11:00' },
    { start: '11:00', end: '12:30' },
    { start: '14:00', end: '15:30' },
    { start: '15:30', end: '17:00' },
    { start: '17:00', end: '18:30' },
  ];

  private readonly CANDIDATE_DAYS: DayOfWeek[] = [
    DayOfWeek.LUNDI,
    DayOfWeek.MARDI,
    DayOfWeek.MERCREDI,
    DayOfWeek.JEUDI,
    DayOfWeek.VENDREDI,
    DayOfWeek.SAMEDI,
  ];

  // Convertit "08:00" en objet Date exploitable par Prisma (@db.Time ignore
  // la partie date, seule l'heure compte, mais Prisma exige un objet Date).
  private toTimeDate(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(1970, 0, 1, hours, minutes);
  }

  // Détecte si un nouveau créneau chevauche un créneau existant, pour une
  // salle ou un enseignant donné, un jour donné.
  // Chevauchement classique : (startA < endB) ET (endA > startB)
  private async findConflicts(
    dayOfWeek: DayOfWeek,
    startTime: Date,
    endTime: Date,
    classroomId: string,
    teacherId: string,
    excludeScheduleId?: string,
  ) {
    const candidates = await this.prisma.schedule.findMany({
      where: {
        dayOfWeek,
        deletedAt: null,
        id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
        course: {
          OR: [{ classroomId }, { teacherId }],
        },
      },
      include: { course: true },
    });

    return candidates.filter((s) => {
      const overlaps = startTime < s.endTime && endTime > s.startTime;
      if (!overlaps) return false;
      const sameClassroom = s.course.classroomId === classroomId;
      const sameTeacher = s.course.teacherId === teacherId;
      return sameClassroom || sameTeacher;
    });
  }

  async create(dto: CreateScheduleDto) {
    const course = await this.prisma.course.findFirst({
      where: { id: dto.courseId, deletedAt: null },
    });
    if (!course) {
      throw new NotFoundException(`Cours ${dto.courseId} introuvable`);
    }

    const startTime = this.toTimeDate(dto.startTime);
    const endTime = this.toTimeDate(dto.endTime);

    const conflicts = await this.findConflicts(
      dto.dayOfWeek,
      startTime,
      endTime,
      course.classroomId,
      course.teacherId,
    );

    if (conflicts.length > 0) {
      throw new ConflictException(
        `Conflit détecté : salle ou enseignant déjà occupé(e) sur ce créneau (${dto.dayOfWeek} ${dto.startTime}-${dto.endTime})`,
      );
    }

    return this.prisma.schedule.create({
      data: {
        courseId: dto.courseId,
        dayOfWeek: dto.dayOfWeek,
        startTime,
        endTime,
      },
    });
  }

  findAll() {
    return this.prisma.schedule.findMany({
      where: { deletedAt: null },
      include: {
        course: {
          include: { teachingUnit: true, classroom: true, teacher: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findFirst({
      where: { id, deletedAt: null },
      include: { course: true },
    });
    if (!schedule) {
      throw new NotFoundException(`Créneau ${id} introuvable`);
    }
    return schedule;
  }

  async update(id: string, dto: UpdateScheduleDto) {
    const existing = await this.findOne(id);
    const dayOfWeek = dto.dayOfWeek ?? existing.dayOfWeek;
    const startTime = dto.startTime
      ? this.toTimeDate(dto.startTime)
      : existing.startTime;
    const endTime = dto.endTime
      ? this.toTimeDate(dto.endTime)
      : existing.endTime;

    const conflicts = await this.findConflicts(
      dayOfWeek,
      startTime,
      endTime,
      existing.course.classroomId,
      existing.course.teacherId,
      id,
    );

    if (conflicts.length > 0) {
      throw new ConflictException('Conflit détecté avec ce nouveau créneau');
    }

    return this.prisma.schedule.update({
      where: { id },
      data: { dayOfWeek, startTime, endTime },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.schedule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findMineByUserId(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });

    if (teacher) {
      return this.prisma.schedule.findMany({
        where: { deletedAt: null, course: { teacherId: teacher.id } },
        include: {
          course: {
            include: { teachingUnit: true, teacher: true, classroom: true },
          },
        },
      });
    }

    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return [];
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: student.id,
        status: 'VALIDATED',
        deletedAt: null,
      },
      select: { teachingUnitId: true },
    });

    if (enrollments.length === 0) {
      return [];
    }

    return this.prisma.schedule.findMany({
      where: {
        deletedAt: null,
        course: { teachingUnitId: { in: enrollments.map((e) => e.teachingUnitId) } },
      },
      include: {
        course: {
          include: { teachingUnit: true, teacher: true, classroom: true },
        },
      },
    });
  }

  // Génération automatique de créneaux (§10.2 et §4.7 du CDC).
  // Algorithme glouton : pour chaque cours, on essaie les créneaux candidats
  // dans l'ordre et on place le premier sans conflit. Traitement séquentiel
  // (pas en parallèle) : chaque placement doit être pris en compte par les
  // vérifications du cours suivant.
  // Limitation assumée : pas d'auto-ajustement (réassignation de salle,
  // division de groupe) — à documenter comme simplification pour ce sprint.
  async generate(dto: GenerateSchedulesDto) {
    const results: {
      courseId: string;
      status: 'placed' | 'failed';
      schedule?: any;
      reason?: string;
    }[] = [];

    for (const courseId of dto.courseIds) {
      const course = await this.prisma.course.findFirst({
        where: { id: courseId, deletedAt: null },
      });

      if (!course) {
        results.push({
          courseId,
          status: 'failed',
          reason: 'Cours introuvable',
        });
        continue;
      }

      let placed = false;

      for (const day of this.CANDIDATE_DAYS) {
        for (const slot of this.CANDIDATE_SLOTS) {
          const startTime = this.toTimeDate(slot.start);
          const endTime = this.toTimeDate(slot.end);

          const conflicts = await this.findConflicts(
            day,
            startTime,
            endTime,
            course.classroomId,
            course.teacherId,
          );

          if (conflicts.length === 0) {
            const schedule = await this.prisma.schedule.create({
              data: { courseId, dayOfWeek: day, startTime, endTime },
            });
            results.push({ courseId, status: 'placed', schedule });
            placed = true;
            break;
          }
        }
        if (placed) break;
      }

      if (!placed) {
        results.push({
          courseId,
          status: 'failed',
          reason:
            'Aucun créneau disponible sans conflit — auto-ajustement (réassignation de salle) non implémenté dans cette version',
        });
      }
    }

    return results;
  }
}
