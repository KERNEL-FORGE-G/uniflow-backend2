import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminToolController } from './admin-tool.controller';
import { AdminToolService } from './admin-tool.service';

@Module({
  imports: [
    PrismaModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'src', 'admin-tool', 'public'),
      serveRoot: '/admin-tool-ui',
    }),
  ],
  controllers: [AdminToolController],
  providers: [AdminToolService],
})
export class AdminToolModule {}
