import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
    });
  }

  create(
    userId: string,
    data: { name: string; color: string; icon?: string; sort?: number },
  ) {
    return this.prisma.category.create({
      data: {
        userId,
        name: data.name,
        color: data.color,
        icon: data.icon,
        sort: data.sort ?? 99,
        isSystem: false,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    data: Partial<{ name: string; color: string; icon: string; sort: number }>,
  ) {
    await this.ensureOwned(userId, id);
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    const cat = await this.ensureOwned(userId, id);
    if (cat.isSystem) {
      throw new ForbiddenException('系统预置分类不可删除');
    }
    const count = await this.prisma.item.count({
      where: { categoryId: id, status: 'active' },
    });
    if (count > 0) {
      throw new ForbiddenException('分类下仍有物品，无法删除');
    }
    await this.prisma.category.delete({ where: { id } });
    return true;
  }

  private async ensureOwned(userId: string, id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat || cat.userId !== userId) {
      throw new NotFoundException('分类不存在');
    }
    return cat;
  }
}
