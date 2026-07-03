import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 部位分类树（一级 + 二级） */
  async categoryTree() {
    const all = await this.prisma.skillCategory.findMany({
      where: { active: true },
      orderBy: { sort: 'asc' },
    });
    const roots = all.filter((c) => c.parentId === null);
    return roots.map((r) => ({
      ...r,
      children: all.filter((c) => c.parentId === r.id),
    }));
  }

  async allCategoriesFlat() {
    return this.prisma.skillCategory.findMany({
      where: { active: true },
      orderBy: { sort: 'asc' },
    });
  }

  async createCategory(name: string, parentId?: number, sort = 0) {
    return this.prisma.skillCategory.create({ data: { name, parentId, sort } });
  }

  async updateCategory(id: number, data: { name?: string; sort?: number; active?: boolean }) {
    return this.prisma.skillCategory.update({ where: { id }, data });
  }

  async brands() {
    return this.prisma.brand.findMany({
      where: { active: true },
      orderBy: [{ type: 'asc' }, { sort: 'asc' }],
    });
  }

  async createBrand(name: string, type: any, sort = 0) {
    return this.prisma.brand.create({ data: { name, type, sort } });
  }
}
