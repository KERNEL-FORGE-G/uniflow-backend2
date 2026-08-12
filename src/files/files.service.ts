import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { PrismaService } from '../prisma/prisma.service';
import { EntityType } from '@prisma/client';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async uploadFile(file: any, entityType: EntityType, entityId: string) {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: 'uniflow_docs' },
        async (error, result) => {
          if (error) return reject(error);
          
          // Sauvegarde dans la BD
          const attachment = await (this.prisma as any).attachment.create({
            data: {
              url: result!.secure_url,
              publicId: result!.public_id,
              filename: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              entityType,
              entityId,
            },
          });
          resolve(attachment);
        }
      );
      Readable.from(file.buffer).pipe(upload);
    });
  }

  async deleteFile(id: string) {
    const attachment = await (this.prisma as any).attachment.findUnique({ where: { id } });
    if (!attachment) return;
    
    await cloudinary.uploader.destroy(attachment.publicId);
    await (this.prisma as any).attachment.delete({ where: { id } });
  }
}
