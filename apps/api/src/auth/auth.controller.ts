import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ok } from '../common/response';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller()
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('auth/register')
  async register(@Body() dto: RegisterDto) {
    return ok(await this.auth.register(dto));
  }

  @Post('auth/login')
  async login(@Body() dto: LoginDto) {
    return ok(await this.auth.login(dto));
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { id: string; username: string; nickname?: string }) {
    return ok(user);
  }
}
