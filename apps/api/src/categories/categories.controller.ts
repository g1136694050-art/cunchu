import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ok } from '../common/response';
import { CategoriesService } from './categories.service';

class CategoryDto {
  @IsString()
  @MaxLength(32)
  name: string;

  @IsString()
  @MaxLength(16)
  color: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private service: CategoriesService) {}

  @Get()
  async list(@CurrentUser() user: { id: string }) {
    return ok(await this.service.list(user.id));
  }

  @Post()
  async create(@CurrentUser() user: { id: string }, @Body() dto: CategoryDto) {
    return ok(await this.service.create(user.id, dto));
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: Partial<CategoryDto>,
  ) {
    return ok(await this.service.update(user.id, id, dto));
  }

  @Delete(':id')
  async remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return ok(await this.service.remove(user.id, id));
  }
}
