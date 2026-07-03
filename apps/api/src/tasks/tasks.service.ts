import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WorkerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private readonly autoIdleHours = process.env.AUTO_IDLE_HOURS
    ? Number(process.env.AUTO_IDLE_HOURS)
    : 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  /** 每分钟扫描：工作中超过 N 小时的师傅自动转空闲 */
  @Cron(CronExpression.EVERY_MINUTE)
  async autoIdle() {
    const threshold = new Date(Date.now() - this.autoIdleHours * 60 * 60 * 1000);
    const stale = await this.prisma.worker.findMany({
      where: {
        status: WorkerStatus.WORKING,
        workingSince: { lte: threshold },
      },
      select: { id: true },
    });
    if (stale.length === 0) return;

    const ids = stale.map((w) => w.id);
    await this.prisma.worker.updateMany({
      where: { id: { in: ids } },
      data: { status: WorkerStatus.IDLE, workingSince: null },
    });

    for (const id of ids) {
      this.realtime.emitToAdmins('worker:status', { id, status: WorkerStatus.IDLE, auto: true });
      this.realtime.emitToWorker(id, 'status:auto-idle', { hours: this.autoIdleHours });
    }
    this.logger.log(`自动转空闲 ${ids.length} 人（超过 ${this.autoIdleHours} 小时）`);
  }
}
