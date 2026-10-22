import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto, StockChangeDto, UpdateItemDto } from './dto/item.dto';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  async list(
    userId: string,
    query: {
      q?: string;
      categoryId?: string;
      locationId?: string;
      expire?: string;
      lowStock?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 50));
    const where: Prisma.ItemWhereInput = {
      userId,
      status: 'active',
    };

    if (query.q) {
      where.OR = [
        { name: { contains: query.q } },
        { remark: { contains: query.q } },
        { spec: { contains: query.q } },
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.locationId) where.locationId = query.locationId;

    const now = new Date();
    if (query.expire === 'soon') {
      const soon = new Date();
      soon.setDate(soon.getDate() + 7);
      where.expireAt = { gte: now, lte: soon };
    } else if (query.expire === 'expired') {
      where.expireAt = { lt: now };
    }

    const [total, items] = await Promise.all([
      this.prisma.item.count({ where }),
      this.prisma.item.findMany({
        where,
        include: {
          category: true,
          location: true,
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    let list = items;
    if (query.lowStock === '1') {
      list = items.filter(
        (i) =>
          i.lowStockThreshold != null && i.quantity <= i.lowStockThreshold,
      );
    }

    return {
      list: list.map((i) => this.decorate(i)),
      total: query.lowStock === '1' ? list.length : total,
      page,
      pageSize,
    };
  }

  async detail(userId: string, id: string) {
    const item = await this.prisma.item.findFirst({
      where: { id, userId, status: 'active' },
      include: {
        category: true,
        location: true,
        images: { orderBy: { sort: 'asc' } },
      },
    });
    if (!item) throw new NotFoundException('物品不存在');
    return this.decorate(item);
  }

  async create(userId: string, dto: CreateItemDto) {
    await this.ensureCategory(userId, dto.categoryId);
    if (dto.locationId) await this.ensureLocation(userId, dto.locationId);

    const item = await this.prisma.item.create({
      data: {
        userId,
        name: dto.name,
        categoryId: dto.categoryId,
        locationId: dto.locationId || null,
        quantity: dto.quantity,
        unit: dto.unit || '个',
        price: dto.price ?? null,
        lowStockThreshold: dto.lowStockThreshold ?? null,
        expireAt: dto.expireAt ? new Date(dto.expireAt) : null,
        spec: dto.spec || null,
        remark: dto.remark || null,
        coverUrl: dto.coverUrl || null,
        stockLogs: {
          create: {
            userId,
            delta: dto.quantity,
            quantityAfter: dto.quantity,
            reason: 'purchase',
            note: '初始入库',
          },
        },
      },
      include: { category: true, location: true },
    });
    return this.decorate(item);
  }

  async update(userId: string, id: string, dto: UpdateItemDto) {
    await this.ensureOwned(userId, id);
    if (dto.categoryId) await this.ensureCategory(userId, dto.categoryId);
    if (dto.locationId) await this.ensureLocation(userId, dto.locationId);

    const data: Prisma.ItemUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.categoryId !== undefined) {
      data.category = { connect: { id: dto.categoryId } };
    }
    if (dto.locationId !== undefined) {
      data.location = dto.locationId
        ? { connect: { id: dto.locationId } }
        : { disconnect: true };
    }
    if (dto.unit !== undefined) data.unit = dto.unit;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.lowStockThreshold !== undefined) {
      data.lowStockThreshold = dto.lowStockThreshold;
    }
    if (dto.expireAt !== undefined) {
      data.expireAt = dto.expireAt ? new Date(dto.expireAt) : null;
    }
    if (dto.spec !== undefined) data.spec = dto.spec;
    if (dto.remark !== undefined) data.remark = dto.remark;
    if (dto.coverUrl !== undefined) data.coverUrl = dto.coverUrl;

    if (dto.quantity !== undefined) {
      const current = await this.prisma.item.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('物品不存在');
      const delta = dto.quantity - current.quantity;
      if (dto.quantity < 0) throw new BadRequestException('数量不能为负');
      data.quantity = dto.quantity;
      const item = await this.prisma.item.update({
        where: { id },
        data: {
          ...data,
          stockLogs: {
            create: {
              userId,
              delta,
              quantityAfter: dto.quantity,
              reason: 'adjust',
              note: '编辑调整数量',
            },
          },
        },
        include: { category: true, location: true, images: true },
      });
      return this.decorate(item);
    }

    const item = await this.prisma.item.update({
      where: { id },
      data,
      include: { category: true, location: true, images: true },
    });
    return this.decorate(item);
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    await this.prisma.item.update({
      where: { id },
      data: { status: 'archived' },
    });
    return true;
  }

  async changeStock(userId: string, id: string, dto: StockChangeDto) {
    const item = await this.ensureOwned(userId, id);
    const next = item.quantity + dto.delta;
    if (next < 0) throw new BadRequestException('库存不足');

    const updated = await this.prisma.item.update({
      where: { id },
      data: {
        quantity: next,
        stockLogs: {
          create: {
            userId,
            delta: dto.delta,
            quantityAfter: next,
            reason: dto.reason || 'adjust',
            note: dto.note,
          },
        },
      },
      include: { category: true, location: true },
    });
    return this.decorate(updated);
  }

  async logs(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    return this.prisma.stockLog.findMany({
      where: { itemId: id, userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private decorate<T extends { quantity: number; lowStockThreshold: number | null; expireAt: Date | null }>(
    item: T,
  ) {
    const now = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);
    const isLowStock =
      item.lowStockThreshold != null &&
      item.quantity <= item.lowStockThreshold;
    const isExpired = !!item.expireAt && item.expireAt < now;
    const isExpiringSoon =
      !!item.expireAt &&
      !isExpired &&
      item.expireAt <= soon;
    return { ...item, isLowStock, isExpired, isExpiringSoon };
  }

  private async ensureOwned(userId: string, id: string) {
    const item = await this.prisma.item.findFirst({
      where: { id, userId, status: 'active' },
    });
    if (!item) throw new NotFoundException('物品不存在');
    return item;
  }

  private async ensureCategory(userId: string, categoryId: string) {
    const cat = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
    });
    if (!cat) throw new BadRequestException('分类无效');
  }

  private async ensureLocation(userId: string, locationId: string) {
    const loc = await this.prisma.location.findFirst({
      where: { id: locationId, userId },
    });
    if (!loc) throw new BadRequestException('位置无效');
  }
}
