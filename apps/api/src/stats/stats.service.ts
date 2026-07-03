import { Injectable } from '@nestjs/common';
import { OrderStatus, WorkerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 调度大屏概览 */
  async dashboard() {
    const [idle, working, totalWorkers] = await Promise.all([
      this.prisma.worker.count({ where: { active: true, status: WorkerStatus.IDLE } }),
      this.prisma.worker.count({ where: { active: true, status: WorkerStatus.WORKING } }),
      this.prisma.worker.count({ where: { active: true } }),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayOrders, pending, inProgress, completedToday] = await Promise.all([
      this.prisma.dispatchOrder.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.dispatchOrder.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.dispatchOrder.count({ where: { status: OrderStatus.IN_PROGRESS } }),
      this.prisma.dispatchOrder.count({
        where: { status: OrderStatus.COMPLETED, completedAt: { gte: todayStart } },
      }),
    ]);

    return {
      workers: { idle, working, total: totalWorkers },
      orders: { today: todayOrders, pending, inProgress, completedToday },
      saturation: totalWorkers ? Math.round((working / totalWorkers) * 100) : 0,
    };
  }

  /** 擅长部位分布（一级分类聚合） */
  async skillDistribution() {
    const roots = await this.prisma.skillCategory.findMany({
      where: { parentId: null, active: true },
      include: { children: true },
      orderBy: { sort: 'asc' },
    });
    const result: { name: string; count: number }[] = [];
    for (const root of roots) {
      const ids = [root.id, ...root.children.map((c) => c.id)];
      const count = await this.prisma.workerSkill.count({
        where: { categoryId: { in: ids } },
      });
      result.push({ name: root.name, count });
    }
    return result;
  }

  /** 近 7 天派单趋势 */
  async orderTrend() {
    const days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - i);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const count = await this.prisma.dispatchOrder.count({
        where: { createdAt: { gte: start, lt: end } },
      });
      days.push({ date: `${start.getMonth() + 1}/${start.getDate()}`, count });
    }
    return days;
  }

  /** 行为埋点（点击分析） */
  async track(params: {
    actorType: string;
    actorId?: number;
    event: string;
    targetId?: number;
    meta?: any;
  }) {
    return this.prisma.statEvent.create({ data: params });
  }
}
