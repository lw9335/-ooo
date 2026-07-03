import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WeworkService } from '../wework/wework.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wework: WeworkService,
    private readonly realtime: RealtimeGateway,
  ) {}

  /** 创建通知：落库 + 实时推送 + 企业微信消息 */
  async notify(params: {
    workerId: number;
    title: string;
    content: string;
    type?: NotificationType;
    orderId?: number;
  }) {
    const worker = await this.prisma.worker.findUnique({ where: { id: params.workerId } });
    if (!worker) return null;

    const notification = await this.prisma.notification.create({
      data: {
        workerId: params.workerId,
        title: params.title,
        content: params.content,
        type: params.type || NotificationType.SYSTEM,
        orderId: params.orderId,
      },
    });

    // 应用内实时推送
    this.realtime.emitToWorker(params.workerId, 'notification', notification);

    // 企业微信消息推送
    if (worker.weworkUserId) {
      const pushed = await this.wework.sendTextCard(
        worker.weworkUserId,
        params.title,
        params.content,
      );
      if (pushed) {
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: { pushed: true },
        });
      }
    }
    return notification;
  }

  async listByWorker(workerId: number) {
    return this.prisma.notification.findMany({
      where: { workerId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(id: number) {
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllRead(workerId: number) {
    await this.prisma.notification.updateMany({
      where: { workerId, read: false },
      data: { read: true },
    });
    return { success: true };
  }
}
