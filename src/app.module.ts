import { AdminToolModule } from './admin-tool/admin-tool.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { UeModule } from './ue/ue.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { SyncModule } from './sync/sync.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { CoursesModule } from './courses/courses.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AttendanceModule } from './attendance/attendance.module';
import { VideoconferenceModule } from './videoconference/videoconference.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { StatsModule } from './stats/stats.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    PrismaModule,
    StudentsModule,
    TeachersModule,
    UeModule,
    EnrollmentsModule,
    SyncModule,
    NotificationsModule,
    ClassroomsModule,
    CoursesModule,
    SchedulesModule,
    AttendanceModule,
    VideoconferenceModule,
    StatsModule,
    AuditLogsModule,
    AdminToolModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
