import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { CloudinaryProvider } from './cloudinary.provider';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CloudinaryProvider, FilesService],
  exports: [FilesService],
})
export class FilesModule {}
