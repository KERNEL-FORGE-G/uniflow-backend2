import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [studentCount, teacherCount, courseCount] = await Promise.all([
      this.prisma.student.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.teacher.count({ where: { deletedAt: null } }),
      this.prisma.course.count({ where: { deletedAt: null } }),
    ])

    return {
      studentCount,
      teacherCount,
      courseCount,
      satisfactionRate: 98,
      supportAvailability: '24/7',
    }
  }
}
