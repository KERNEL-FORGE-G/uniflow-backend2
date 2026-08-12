// src/videoconference/videoconference.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';
import { PrismaService } from '../prisma/prisma.service';
import { decrypt, encrypt } from '../common/utils/encryption.util';
import { generateLiveKitCredentials } from '../common/utils/livekit-credentials.util';

export interface LiveKitWebhookPayload {
  event: string;
  room?: {
    name: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

@Injectable()
export class VideoconferenceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(hostId: string, courseId?: string, maxParticipants?: number) {
    const { apiKey, apiSecret } = generateLiveKitCredentials();

    const conference = await this.prisma.videoConference.create({
      data: {
        hostId,
        courseId,
        apiKey,
        apiSecretEncrypted: encrypt(apiSecret),
        maxParticipants,
        mode: 'LAN',
        status: 'ACTIVE',
      },
    });

    const hostToken = await this.mintToken(
      conference.id,
      apiKey,
      apiSecret,
      hostId,
      true,
    );

    // apiKey/apiSecret ne sont renvoyés en clair QUE cette fois-ci, au créateur,
    // pour qu'il configure son livekit-server local. Ils ne ressortiront plus jamais.
    return {
      conferenceId: conference.id,
      apiKey,
      apiSecret,
      hostToken,
    };
  }

  async join(conferenceId: string, userId: string) {
    const conference = await this.prisma.videoConference.findUnique({
      where: { id: conferenceId },
    });
    if (!conference) throw new NotFoundException('Réunion introuvable');
    if (conference.status === 'ENDED') {
      throw new BadRequestException(
        'Cette réunion est terminée, le lien a expiré',
      );
    }
    if (!conference.localUrl && !conference.publicUrl) {
      throw new BadRequestException(
        "La réunion n'est pas encore prête côté hôte",
      );
    }

    const apiSecret = decrypt(conference.apiSecretEncrypted);
    const token = await this.mintToken(
      conference.id,
      conference.apiKey,
      apiSecret,
      userId,
      false,
    );

    await this.prisma.conferenceParticipant.create({
      data: { conferenceId: conference.id, userId },
    });

    // C'est ICI que la bascule est transparente : le client appelle toujours
    // le même endpoint, et reçoit l'URL actuellement valide.
    const serverUrl =
      conference.mode === 'INTERNET' && conference.publicUrl
        ? conference.publicUrl
        : conference.localUrl;

    return { token, serverUrl, mode: conference.mode };
  }

  async setLocalUrl(conferenceId: string, hostId: string, localUrl: string) {
    const conference = await this.getOwnedConference(conferenceId, hostId);
    return this.prisma.videoConference.update({
      where: { id: conference.id },
      data: { localUrl },
    });
  }

  async enableInternetMode(
    conferenceId: string,
    hostId: string,
    publicUrl: string,
  ) {
    const conference = await this.getOwnedConference(conferenceId, hostId);
    // localUrl n'est pas effacée : les participants déjà connectés en LAN
    // restent sur le même serveur, rien ne change pour eux.
    return this.prisma.videoConference.update({
      where: { id: conference.id },
      data: { mode: 'INTERNET', publicUrl },
    });
  }

  async end(conferenceId: string, hostId: string) {
    const conference = await this.getOwnedConference(conferenceId, hostId);
    await this.prisma.conferenceParticipant.updateMany({
      where: { conferenceId: conference.id, leftAt: null },
      data: { leftAt: new Date() },
    });
    return this.prisma.videoConference.update({
      where: { id: conference.id },
      data: { status: 'ENDED', endedAt: new Date() },
    });
  }

  async handleWebhook(body: LiveKitWebhookPayload) {
    if (body.event === 'room_finished' && body.room?.name) {
      const conferenceId = body.room.name;
      const conference = await this.prisma.videoConference.findUnique({
        where: { id: conferenceId },
      });
      if (conference && conference.status === 'ACTIVE') {
        await this.prisma.conferenceParticipant.updateMany({
          where: { conferenceId: conference.id, leftAt: null },
          data: { leftAt: new Date() },
        });
        return this.prisma.videoConference.update({
          where: { id: conference.id },
          data: { status: 'ENDED', endedAt: new Date() },
        });
      }
    }
    return { status: 'ignored' };
  }

  private async getOwnedConference(conferenceId: string, hostId: string) {
    const conference = await this.prisma.videoConference.findUnique({
      where: { id: conferenceId },
    });
    if (!conference) throw new NotFoundException('Réunion introuvable');
    if (conference.hostId !== hostId) {
      throw new ForbiddenException("Seul l'hôte peut gérer cette réunion");
    }
    return conference;
  }

  private async mintToken(
    roomName: string,
    apiKey: string,
    apiSecret: string,
    identity: string,
    isHost: boolean,
  ): Promise<string> {
    const at = new AccessToken(apiKey, apiSecret, { identity, ttl: '4h' });
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      roomAdmin: isHost,
    });
    return at.toJwt();
  }
}
