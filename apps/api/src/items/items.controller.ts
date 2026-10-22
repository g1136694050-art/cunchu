import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ok } from '../common/response';
import { CreateItemDto, StockChangeDto, UpdateItemDto } from './dto/item.dto';
import { ItemsService } from './items.service';

@Controller('items')
@UseGuards(JwtAuthGuard)
export class ItemsController {
  constructor(private service: ItemsService) {}

  @Get()
  async list(
    @CurrentUser() user: { id: string },
    @Query()
    query: {
      q?: string;
      categoryId?: string;
      locationId?: string;
      expire?: string;
      lowStock?: string;
      page?: string;
      pageSize?: string;
    },
  ) {
    return ok(
      await this.service.list(user.id, {
        ...query,
        page: query.page ? Number(query.page) : 1,
        pageSize: query.pageSize ? Number(query.pageSize) : 50,
      }),
    );
  }

  @Get(':id')
  async detail(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return ok(await this.service.detail(user.id, id));
  }

  @Post()
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateItemDto,
  ) {
    return ok(await this.service.create(user.id, dto));
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
  ) {
    return ok(await this.service.update(user.id, id, dto));
  }

  @Delete(':id')
  async remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return ok(await this.service.remove(user.id, id));
  }

  @Post(':id/stock')
  async stock(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: StockChangeDto,
  ) {
    return ok(await this.service.changeStock(user.id, id, dto));
  }

  @Get(':id/logs')
  async logs(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return ok(await this.service.logs(user.id, id));
  }
}
