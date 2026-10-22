import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async tree(userId: string) {
    const all = await this.prisma.location.findMany({
      where: { userId },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: { select: { items: { where: { status: 'active' } } } },
      },
    });

    const map = new Map<string, any>();
    all.forEach((loc) => {
      map.set(loc.id, { ...loc, children: [], itemCount: loc._count.items });
    });

    const roots: any[] = [];
    map.forEach((loc) => {
      if (loc.parentId && map.has(loc.parentId)) {
        map.get(loc.parentId).children.push(loc);
      } else {
        roots.push(loc);
      }
    });
    return roots;
  }

  create(
    userId: string,
    data: { name: string; parentId?: string; sort?: number },
  ) {
    return this.prisma.location.create({
      data: {
        userId,
        name: data.name,
        parentId: data.parentId || null,
        sort: data.sort ?? 0,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    data: Partial<{ name: string; parentId: string | null; sort: number }>,
  ) {
    await this.ensureOwned(userId, id);
    return this.prisma.location.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    await this.prisma.item.updateMany({
      where: { locationId: id },
      data: { locationId: null },
    });
    await this.prisma.location.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    });
    await this.prisma.location.delete({ where: { id } });
    return true;
  }

  private async ensureOwned(userId: string, id: string) {
    const loc = await this.prisma.location.findUnique({ where: { id } });
    if (!loc || loc.userId !== userId) {
      throw new NotFoundException('位置不存在');
    }
    return loc;
  }
}
