import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ok } from '../common/response';
import { AlertsService } from './alerts.service';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private service: AlertsService) {}

  @Get('summary')
  async summary(@CurrentUser() user: { id: string }) {
    return ok(await this.service.summary(user.id));
  }
}
