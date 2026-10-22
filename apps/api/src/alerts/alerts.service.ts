import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async summary(userId: string) {
    const now = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);

    const items = await this.prisma.item.findMany({
      where: { userId, status: 'active' },
      include: { category: true, location: true },
      orderBy: { expireAt: 'asc' },
    });

    const expired = items.filter((i) => i.expireAt && i.expireAt < now);
    const expiringSoon = items.filter(
      (i) => i.expireAt && i.expireAt >= now && i.expireAt <= soon,
    );
    const lowStock = items.filter(
      (i) =>
        i.lowStockThreshold != null && i.quantity <= i.lowStockThreshold,
    );

    return {
      expiredCount: expired.length,
      expiringSoonCount: expiringSoon.length,
      lowStockCount: lowStock.length,
      expired,
      expiringSoon,
      lowStock,
    };
  }
}
