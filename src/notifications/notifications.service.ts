import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('NotificationsService');

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type ?? 'INFO',
        channel: dto.channel ?? 'IN_APP',
      },
    });

    // Déclenche l'envoi externe selon le canal choisi (§4.4, §14.4 du CDC).
    // Tant que les clés FCM/SMS ne sont pas configurées, on journalise
    // l'intention d'envoi plutôt que d'échouer silencieusement.
    if (notification.channel === 'PUSH') {
      this.sendPush(
        notification.userId,
        notification.title,
        notification.message,
      );
    } else if (notification.channel === 'SMS') {
      this.sendSms(notification.userId, notification.message);
    }

    return notification;
  }

  async findAllForUser(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countUnread(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false, deletedAt: null },
    });
    return { unreadCount: count };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (
      !notification ||
      notification.deletedAt ||
      notification.userId !== userId
    ) {
      throw new NotFoundException('Notification introuvable');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async remove(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (
      !notification ||
      notification.deletedAt ||
      notification.userId !== userId
    ) {
      throw new NotFoundException('Notification introuvable');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Envoi push via Firebase Cloud Messaging (§7 du CDC).
   * ⚠️ STUB : les clés FCM ne sont pas encore configurées.
   * Une fois disponibles (variable FCM_SERVER_KEY en .env), remplacer
   * ce log par un appel réel au SDK firebase-admin.
   */
  private sendPush(userId: string, title: string, message: string): void {
    this.logger.log(
      `[STUB PUSH] Destinataire=${userId} | Titre="${title}" | Message="${message}"`,
    );
    // TODO: intégrer firebase-admin une fois les credentials disponibles
  }

  /**
   * Envoi SMS de secours via passerelle MTN/Orange ou Twilio (§14.4 du CDC).
   * ⚠️ STUB : aucun compte agrégateur configuré pour l'instant.
   */
  private sendSms(userId: string, message: string): void {
    this.logger.log(`[STUB SMS] Destinataire=${userId} | Message="${message}"`);
    // TODO: intégrer la passerelle SMS une fois le compte agrégateur disponible
  }
}
