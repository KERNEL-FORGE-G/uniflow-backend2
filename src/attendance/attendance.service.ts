import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { ScanQrDto } from './dto/scan-qr.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crée une session de présence et génère automatiquement la liste
   * à partir des étudiants inscrits (VALIDATED) à l'UE du cours (§4.7 du CDC :
   * "Liste de présence générée automatiquement à partir des étudiants inscrits
   * à l'UE"). Chaque étudiant démarre avec le statut ABSENT par défaut,
   * à corriger ensuite par le délégué ou via pointage QR.
   */
  async createSession(dto: CreateSessionDto) {
    const course = await this.prisma.course.findFirst({
      where: { id: dto.courseId, deletedAt: null },
      include: { teachingUnit: true },
    });

    if (!course) {
      throw new NotFoundException('Cours introuvable');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        teachingUnitId: course.teachingUnitId,
        status: 'VALIDATED',
        deletedAt: null,
      },
    });

    const session = await this.prisma.attendanceSession.create({
      data: {
        courseId: dto.courseId,
        date: new Date(dto.date),
        records: {
          create: enrollments.map((enrollment) => ({
            studentId: enrollment.studentId,
            status: 'ABSENT',
          })),
        },
      },
      include: {
        records: {
          include: {
            student: {
              select: { firstName: true, lastName: true, matricule: true },
            },
          },
        },
      },
    });

    return session;
  }

  async findOne(id: string) {
    const session = await this.prisma.attendanceSession.findFirst({
      where: { id, deletedAt: null },
      include: {
        course: { include: { teachingUnit: true } },
        records: {
          include: {
            student: {
              select: { firstName: true, lastName: true, matricule: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session de présence introuvable');
    }

    return session;
  }

  async findByCourse(courseId: string) {
    return this.prisma.attendanceSession.findMany({
      where: { courseId, deletedAt: null },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Marquage manuel par le délégué/enseignant (§4.7 : "le délégué
   * valide/modifie la liste pendant le cours").
   */
  async markAttendance(sessionId: string, dto: MarkAttendanceDto) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId: dto.studentId,
        },
      },
    });

    if (!record || record.deletedAt) {
      throw new NotFoundException(
        'Cet étudiant ne fait pas partie de la liste de cette session',
      );
    }

    return this.prisma.attendanceRecord.update({
      where: { id: record.id },
      data: { status: dto.status, markedAt: new Date() },
    });
  }

  /**
   * Pointage direct par l'étudiant via scan du QR code de la session
   * (§4.7 : "QR code unique par session... vérification côté serveur").
   */
  async scanQr(dto: ScanQrDto, studentId: string) {
    const session = await this.prisma.attendanceSession.findFirst({
      where: { qrToken: dto.qrToken, deletedAt: null },
    });

    if (!session) {
      throw new NotFoundException('QR code invalide ou session introuvable');
    }

    const record = await this.prisma.attendanceRecord.findUnique({
      where: {
        sessionId_studentId: {
          sessionId: session.id,
          studentId,
        },
      },
    });

    if (!record || record.deletedAt) {
      throw new ConflictException(
        "Vous n'êtes pas inscrit à l'UE de cette session",
      );
    }

    return this.prisma.attendanceRecord.update({
      where: { id: record.id },
      data: { status: 'PRESENT', markedAt: new Date() },
    });
  }

  /**
   * Résout le Student correspondant à un userId (JWT) — nécessaire pour
   * le scan QR, où l'étudiant s'identifie via son token, pas via son studentId.
   */
  async getStudentByUserId(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException(
        'Aucun profil étudiant associé à cet utilisateur',
      );
    }

    return student;
  }

  async remove(id: string) {
    const session = await this.prisma.attendanceSession.findFirst({
      where: { id, deletedAt: null },
    });

    if (!session) {
      throw new NotFoundException('Session de présence introuvable');
    }

    return this.prisma.attendanceSession.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
