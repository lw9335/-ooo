import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { WeworkService } from '../wework/wework.service';

@Injectable()
export class WorkersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly wework: WeworkService,
  ) {}

  private workerInclude = {
    skills: { include: { category: true } },
    brands: { include: { brand: true } },
  };

  async list(params: {
    status?: WorkerStatus;
    categoryId?: number;
    brandId?: number;
    keyword?: string;
  }) {
    const where: any = { active: true };
    if (params.status) where.status = params.status;
    if (params.categoryId) where.skills = { some: { categoryId: Number(params.categoryId) } };
    if (params.brandId) where.brands = { some: { brandId: Number(params.brandId) } };
    if (params.keyword) {
      where.OR = [
        { name: { contains: params.keyword } },
        { phone: { contains: params.keyword } },
      ];
    }
    return this.prisma.worker.findMany({
      where,
      include: this.workerInclude,
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async detail(id: number) {
    const worker = await this.prisma.worker.findUnique({
      where: { id },
      include: this.workerInclude,
    });
    if (!worker) throw new NotFoundException('师傅不存在');
    return worker;
  }

  /** 企业微信免登：用 code 换 userid，找到或创建师傅 */
  async loginByWeworkCode(code: string) {
    const weworkUserId = await this.wework.getUserIdByCode(code);
    if (!weworkUserId) {
      // 未配置企业微信或换取失败：返回 null，前端走手动模式/提示
      return { weworkUserId: null, worker: null };
    }
    let worker = await this.prisma.worker.findUnique({
      where: { weworkUserId },
      include: this.workerInclude,
    });
    if (!worker) {
      worker = await this.prisma.worker.create({
        data: { name: '待完善', phone: '', weworkUserId, profileFilled: false },
        include: this.workerInclude,
      });
    }
    return { weworkUserId, worker };
  }

  /** 保存/完善档案 */
  async upsertProfile(
    id: number | null,
    data: {
      name: string;
      phone: string;
      weworkUserId?: string;
      avatar?: string;
      intro?: string;
      skillCategoryIds?: number[];
      brandIds?: number[];
    },
  ) {
    const base = {
      name: data.name,
      phone: data.phone,
      avatar: data.avatar,
      intro: data.intro,
      profileFilled: true,
    };

    let workerId = id;
    if (!workerId) {
      const created = await this.prisma.worker.create({
        data: { ...base, weworkUserId: data.weworkUserId },
      });
      workerId = created.id;
    } else {
      await this.prisma.worker.update({ where: { id: workerId }, data: base });
    }

    // 重置擅长部位
    if (data.skillCategoryIds) {
      await this.prisma.workerSkill.deleteMany({ where: { workerId } });
      if (data.skillCategoryIds.length) {
        await this.prisma.workerSkill.createMany({
          data: data.skillCategoryIds.map((categoryId) => ({ workerId: workerId!, categoryId })),
          skipDuplicates: true,
        });
      }
    }
    // 重置擅长品牌
    if (data.brandIds) {
      await this.prisma.workerBrand.deleteMany({ where: { workerId } });
      if (data.brandIds.length) {
        await this.prisma.workerBrand.createMany({
          data: data.brandIds.map((brandId) => ({ workerId: workerId!, brandId })),
          skipDuplicates: true,
        });
      }
    }

    const worker = await this.detail(workerId);
    this.realtime.emitToAdmins('worker:updated', worker);
    return worker;
  }

  /** 切换状态：空闲 <-> 工作中 */
  async setStatus(id: number, status: WorkerStatus) {
    const worker = await this.prisma.worker.update({
      where: { id },
      data: {
        status,
        workingSince: status === WorkerStatus.WORKING ? new Date() : null,
      },
      include: this.workerInclude,
    });
    this.realtime.emitToAdmins('worker:status', {
      id: worker.id,
      status: worker.status,
      workingSince: worker.workingSince,
    });
    return worker;
  }

  /** 管理员停用/启用 */
  async setActive(id: number, active: boolean) {
    return this.prisma.worker.update({ where: { id }, data: { active } });
  }
}
