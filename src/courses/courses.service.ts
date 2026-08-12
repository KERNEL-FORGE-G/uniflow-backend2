// src/courses/courses.service.ts
//
// Règle métier notable (§4.7 du CDC) : adéquation type de salle / type de cours
// (CM -> amphithéâtre, TD -> salle, TP -> laboratoire). On la vérifie ici
// avant la création, plutôt que de laisser n'importe quelle combinaison passer.

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseType, ClassroomType } from '@prisma/client';

// Correspondance attendue entre type de cours et type de salle (§4.7 du CDC)
const COURSE_TYPE_TO_CLASSROOM_TYPE: Record<CourseType, ClassroomType> = {
  CM: ClassroomType.AMPHITHEATRE,
  TD: ClassroomType.SALLE_TD,
  TP: ClassroomType.LABORATOIRE,
};

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  private async validateClassroomTypeMatch(
    classroomId: string,
    courseType: CourseType,
  ) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: classroomId, deletedAt: null },
    });
    if (!classroom) {
      throw new NotFoundException(`Salle ${classroomId} introuvable`);
    }
    const expectedType = COURSE_TYPE_TO_CLASSROOM_TYPE[courseType];
    if (classroom.type !== expectedType) {
      throw new BadRequestException(
        `Un cours de type ${courseType} nécessite une salle de type ${expectedType}, mais "${classroom.name}" est de type ${classroom.type}`,
      );
    }
  }

  async create(dto: CreateCourseDto) {
    await this.validateClassroomTypeMatch(dto.classroomId, dto.type);
    return this.prisma.course.create({ data: dto });
  }

  findAll() {
    return this.prisma.course.findMany({
      where: { deletedAt: null },
      include: { teachingUnit: true, teacher: true, classroom: true },
    });
  }

  // Utile pour l'endpoint /teachers/:id/schedule mentionné au §10.2 du CDC —
  // filtre les cours d'un enseignant donné (RBAC §5.1 : l'enseignant ne voit/gère
  // que "ses cours").
  findByTeacher(teacherId: string) {
    return this.prisma.course.findMany({
      where: { teacherId, deletedAt: null },
      include: { teachingUnit: true, classroom: true },
    });
  }
  // Résout le Teacher correspondant à un userId (JWT), puis retourne ses cours.
  // Nécessaire car req.user.userId (issu du token) est l'id User, alors que
  // Course.teacherId référence l'id Teacher (voir §8.2 du CDC) — ce sont deux
  // identifiants différents liés par une relation 1—1.
  async findMineByUserId(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });

    if (teacher) {
      return this.findByTeacher(teacher.id);
    }

    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException(
        'Aucun profil enseignant ou étudiant associé à cet utilisateur',
      );
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

    return this.prisma.course.findMany({
      where: {
        teachingUnitId: { in: enrollments.map((e) => e.teachingUnitId) },
        deletedAt: null,
      },
      include: { teachingUnit: true, teacher: true, classroom: true },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findFirst({
      where: { id, deletedAt: null },
      include: { teachingUnit: true, teacher: true, classroom: true },
    });
    if (!course) {
      throw new NotFoundException(`Cours ${id} introuvable`);
    }
    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    const existing = await this.findOne(id);
    // Si la salle ET le type changent (ou l'un des deux), on revalide la cohérence
    const newClassroomId = dto.classroomId ?? existing.classroomId;
    const newType = dto.type ?? existing.type;
    if (dto.classroomId || dto.type) {
      await this.validateClassroomTypeMatch(newClassroomId, newType);
    }
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.course.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
