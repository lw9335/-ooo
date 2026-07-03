import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { NotificationType, OrderStatus, WorkerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';

export interface RecommendResult {
  worker: any;
  score: number;
  reasons: string[];
}

@Injectable()
export class DispatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * 智能推荐：擅长部位匹配 + 空闲状态 + 品牌匹配 + 接单量均衡
   * 返回按得分降序的候选师傅列表。
   */
  async recommend(params: { categoryId?: number; brandId?: number; limit?: number }): Promise<
    RecommendResult[]
  > {
    const workers = await this.prisma.worker.findMany({
      where: { active: true, profileFilled: true },
      include: {
        skills: { include: { category: true } },
        brands: true,
      },
    });
    if (workers.length === 0) return [];

    // 用于接单量均衡归一化
    const maxOrders = Math.max(1, ...workers.map((w) => w.totalOrders));

    // 目标部位及其父级（便于二级部位匹配到一级擅长）
    let targetCategoryIds: number[] = [];
    if (params.categoryId) {
      const cat = await this.prisma.skillCategory.findUnique({ where: { id: params.categoryId } });
      if (cat) {
        targetCategoryIds = [cat.id];
        if (cat.parentId) targetCategoryIds.push(cat.parentId);
        // 同时匹配该部位的子级
        const children = await this.prisma.skillCategory.findMany({
          where: { parentId: cat.id },
        });
        targetCategoryIds.push(...children.map((c) => c.id));
      }
    }

    const results: RecommendResult[] = workers.map((w) => {
      const reasons: string[] = [];
      let score = 0;

      // 1) 擅长部位匹配（权重最高）
      if (targetCategoryIds.length) {
        const matched = w.skills.find((s) => targetCategoryIds.includes(s.categoryId));
        if (matched) {
          score += 50 + matched.level * 6; // 基础 50 + 熟练度加权
          reasons.push(`擅长「${matched.category.name}」(熟练度${matched.level})`);
        }
      } else {
        // 未指定部位时不加部位分
        score += 10;
      }

      // 2) 品牌匹配
      if (params.brandId) {
        const hitBrand = w.brands.some((b) => b.brandId === params.brandId);
        if (hitBrand) {
          score += 20;
          reasons.push('熟悉该品牌');
        }
      }

      // 3) 空闲状态（重要）
      if (w.status === WorkerStatus.IDLE) {
        score += 30;
        reasons.push('当前空闲');
      } else {
        score -= 10;
        reasons.push('工作中');
      }

      // 4) 接单量均衡：接单越少加分越多（0~15）
      const balance = (1 - w.totalOrders / maxOrders) * 15;
      score += balance;

      return { worker: w, score: Math.round(score * 10) / 10, reasons };
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, params.limit || 10);
  }

  private genOrderNo(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const rand = Math.floor(Math.random() * 900 + 100);
    return `PD${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${rand}`;
  }

  /** 创建并（可选）直接派单 */
  async createOrder(params: {
    title: string;
    description?: string;
    brandName?: string;
    categoryId?: number;
    assignedWorkerId?: number;
    createdById?: number;
  }) {
    const order = await this.prisma.dispatchOrder.create({
      data: {
        orderNo: this.genOrderNo(),
        title: params.title,
        description: params.description,
        brandName: params.brandName,
        categoryId: params.categoryId,
        createdById: params.createdById,
        status: params.assignedWorkerId ? OrderStatus.ASSIGNED : OrderStatus.PENDING,
        assignedWorkerId: params.assignedWorkerId,
        assignedAt: params.assignedWorkerId ? new Date() : null,
      },
      include: { category: true, assignedWorker: true },
    });

    this.realtime.emitToAdmins('order:created', order);

    if (params.assignedWorkerId) {
      await this.pushDispatch(order.id, params.assignedWorkerId);
    }
    return order;
  }

  /** 给已有订单指派师傅（一键派单） */
  async assign(orderId: number, workerId: number) {
    const order = await this.prisma.dispatchOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('派单不存在');
    if (order.status === OrderStatus.COMPLETED)
      throw new BadRequestException('该派单已完成');

    const updated = await this.prisma.dispatchOrder.update({
      where: { id: orderId },
      data: { assignedWorkerId: workerId, status: OrderStatus.ASSIGNED, assignedAt: new Date() },
      include: { category: true, assignedWorker: true },
    });
    await this.pushDispatch(orderId, workerId);
    this.realtime.emitToAdmins('order:updated', updated);
    return updated;
  }

  private async pushDispatch(orderId: number, workerId: number) {
    const order = await this.prisma.dispatchOrder.findUnique({
      where: { id: orderId },
      include: { category: true },
    });
    if (!order) return;
    const parts = [
      order.brandName ? `品牌：${order.brandName}` : '',
      order.category ? `部位：${order.category.name}` : '',
      order.description ? `说明：${order.description}` : '',
    ].filter(Boolean);
    await this.notifications.notify({
      workerId,
      type: NotificationType.DISPATCH,
      title: `新派单：${order.title}`,
      content: parts.join('\n') || order.title,
      orderId,
    });
    this.realtime.emitToWorker(workerId, 'order:dispatch', order);
  }

  /** 师傅接单：状态转工作中 */
  async accept(orderId: number, workerId: number) {
    const order = await this.prisma.dispatchOrder.findUnique({ where: { id: orderId } });
    if (!order || order.assignedWorkerId !== workerId)
      throw new BadRequestException('无效的派单');

    const updated = await this.prisma.dispatchOrder.update({
      where: { id: orderId },
      data: { status: OrderStatus.IN_PROGRESS, acceptedAt: new Date() },
    });
    await this.prisma.worker.update({
      where: { id: workerId },
      data: { status: WorkerStatus.WORKING, workingSince: new Date() },
    });
    this.realtime.emitToAdmins('order:updated', updated);
    this.realtime.emitToAdmins('worker:status', { id: workerId, status: WorkerStatus.WORKING });
    return updated;
  }

  /** 完成派单：累计接单量 +1，状态转空闲 */
  async complete(orderId: number, workerId: number) {
    const order = await this.prisma.dispatchOrder.findUnique({ where: { id: orderId } });
    if (!order || order.assignedWorkerId !== workerId)
      throw new BadRequestException('无效的派单');

    const updated = await this.prisma.dispatchOrder.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED, completedAt: new Date() },
    });
    await this.prisma.worker.update({
      where: { id: workerId },
      data: {
        status: WorkerStatus.IDLE,
        workingSince: null,
        totalOrders: { increment: 1 },
      },
    });
    this.realtime.emitToAdmins('order:updated', updated);
    this.realtime.emitToAdmins('worker:status', { id: workerId, status: WorkerStatus.IDLE });
    return updated;
  }

  async listOrders(params: { status?: OrderStatus; workerId?: number }) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.workerId) where.assignedWorkerId = params.workerId;
    return this.prisma.dispatchOrder.findMany({
      where,
      include: { category: true, assignedWorker: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
