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
import { LocationsService } from './locations.service';

class LocationDto {
  @IsString()
  @MaxLength(64)
  name: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private service: LocationsService) {}

  @Get()
  async tree(@CurrentUser() user: { id: string }) {
    return ok(await this.service.tree(user.id));
  }

  @Post()
  async create(@CurrentUser() user: { id: string }, @Body() dto: LocationDto) {
    return ok(await this.service.create(user.id, dto));
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: Partial<LocationDto>,
  ) {
    return ok(await this.service.update(user.id, id, dto));
  }

  @Delete(':id')
  async remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return ok(await this.service.remove(user.id, id));
  }
}
