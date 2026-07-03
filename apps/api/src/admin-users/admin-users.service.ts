import { Injectable, BadRequestException } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.adminUser.findMany({
      select: { id: true, username: true, name: true, role: true, active: true, createdAt: true },
      orderBy: { id: 'asc' },
    });
  }

  async create(data: { username: string; password: string; name: string; role?: AdminRole }) {
    const exists = await this.prisma.adminUser.findUnique({ where: { username: data.username } });
    if (exists) throw new BadRequestException('账号已存在');
    const password = await bcrypt.hash(data.password, 10);
    const created = await this.prisma.adminUser.create({
      data: {
        username: data.username,
        password,
        name: data.name,
        role: data.role || AdminRole.DISPATCHER,
      },
    });
    return { id: created.id, username: created.username, name: created.name, role: created.role };
  }

  async setActive(id: number, active: boolean) {
    return this.prisma.adminUser.update({
      where: { id },
      data: { active },
      select: { id: true, active: true },
    });
  }

  async resetPassword(id: number, password: string) {
    const hash = await bcrypt.hash(password, 10);
    await this.prisma.adminUser.update({ where: { id }, data: { password: hash } });
    return { success: true };
  }
}
