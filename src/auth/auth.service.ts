import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
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
        role: dto.role,
      },
    });

    if (dto.role === 'ETUDIANT') {
      const levelId = dto.levelId ?? (await this.findOrCreateDefaultLevel());

      await this.prisma.student.create({
        data: {
          userId: user.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          matricule: await this.generateMatricule(),
          levelId,
          specialtyId: dto.specialtyId,
        },
      });
    } else if (dto.role === 'ENSEIGNANT') {
      await this.prisma.teacher.create({
        data: {
          userId: user.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });
    }

    return this.buildAuthResponse(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Compte désactivé');
    }

    return this.buildAuthResponse(user.id);
  }

  async refresh(dto: RefreshDto) {
    let payload: { sub: string; email: string; role: string };

    try {
      payload = this.jwtService.verify(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    const incomingTokenHash = this.hashToken(dto.refreshToken);

    if (incomingTokenHash !== user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    // Rotation : on génère de nouveaux tokens, l'ancien devient inutilisable
    return this.buildAuthResponse(user.id);
  }

  async me(userId: string) {
    const user = await this.findUserWithProfile(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    return this.buildUserProfile(user);
  }

  async getAcademicOptions() {
    await this.ensureAcademicDefaults();
    const levels = await this.prisma.level.findMany({
      select: {
        id: true,
        name: true,
        program: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    const specialties = await this.prisma.specialty.findMany({
      select: {
        id: true,
        name: true,
        levelId: true,
      },
      orderBy: { name: 'asc' },
    });
    return { levels: levels.map(level => ({
      id: level.id,
      name: level.name,
      programName: level.program.name,
    })), specialties };
  }

  async getSpecialties(levelId?: string) {
    await this.ensureAcademicDefaults();
    return this.prisma.specialty.findMany({
      where: levelId ? { levelId } : undefined,
      select: {
        id: true,
        name: true,
        levelId: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  private async ensureAcademicDefaults() {
    const existingLevels = await this.prisma.level.count();
    if (existingLevels > 0) return;

    const faculty = await this.prisma.faculty.create({
      data: { name: 'Faculté des Sciences' },
    });

    const department = await this.prisma.department.create({
      data: {
        name: 'Département d\'Informatique',
        facultyId: faculty.id,
      },
    });

    const program = await this.prisma.program.create({
      data: {
        name: 'Licence Informatique',
        departmentId: department.id,
      },
    });

    const level1 = await this.prisma.level.create({
      data: { name: 'Licence 1', programId: program.id },
    });
    const level2 = await this.prisma.level.create({
      data: { name: 'Licence 2', programId: program.id },
    });
    const level3 = await this.prisma.level.create({
      data: { name: 'Licence 3', programId: program.id },
    });

    await this.prisma.specialty.createMany({
      data: [
        { name: 'Informatique', levelId: level1.id },
        { name: 'Informatique', levelId: level2.id },
        { name: 'Informatique', levelId: level3.id },
        { name: 'Génie Logiciel', levelId: level2.id },
        { name: 'Réseaux et Télécommunications', levelId: level3.id },
      ],
    });
  }

  private async buildAuthResponse(userId: string) {
    const user = await this.findUserWithProfile(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    // Tokens without expiry to allow long-lived sessions (no enforced time limit)
    const accessToken = this.jwtService.sign(payload)

    // Refresh token also without explicit expiry; rotation still applies via stored hash
    const refreshToken = this.jwtService.sign(payload)

    // Hash rapide (SHA-256) adapté à un secret déjà à haute entropie
    const refreshTokenHash = this.hashToken(refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    return {
      accessToken,
      refreshToken,
      user: this.buildUserProfile(user),
    };
  }

  private async findUserWithProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            level: { select: { name: true } },
            specialty: { select: { name: true } },
          },
        },
        teacher: true,
      },
    });
  }

  private buildUserProfile(user: {
    id: string;
    email: string;
    role: string;
    student:
      | {
          id: string;
          firstName: string;
          lastName: string;
          matricule: string;
          level?: { name: string } | null;
          specialty?: { name: string } | null;
        }
      | null;
    teacher: { id: string; firstName: string; lastName: string } | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      student: user.student
        ? {
            id: user.student.id,
            firstName: user.student.firstName,
            lastName: user.student.lastName,
            matricule: user.student.matricule,
            level: user.student.level?.name,
            specialty: user.student.specialty?.name,
          }
        : undefined,
      teacher: user.teacher
        ? {
            id: user.teacher.id,
            firstName: user.teacher.firstName,
            lastName: user.teacher.lastName,
          }
        : undefined,
    };
  }

  private async findOrCreateDefaultLevel() {
    let level = await this.prisma.level.findFirst();
    if (level) return level.id;

    const faculty = await this.prisma.faculty.create({
      data: { name: 'Faculté des Sciences' },
    });

    const department = await this.prisma.department.create({
      data: {
        name: 'Département d\'Informatique',
        facultyId: faculty.id,
      },
    });

    const program = await this.prisma.program.create({
      data: {
        name: 'Licence Informatique',
        departmentId: department.id,
      },
    });

    level = await this.prisma.level.create({
      data: {
        name: 'Licence 1',
        programId: program.id,
      },
    });

    return level.id;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async generateMatricule(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.student.count();
    return `UY1-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}
