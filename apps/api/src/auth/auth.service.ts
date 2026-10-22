import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

const DEFAULT_CATEGORIES = [
  { name: '母婴', color: '#7CB342', sort: 1 },
  { name: '食品饮料', color: '#C62828', sort: 2 },
  { name: '日用清洁', color: '#1565C0', sort: 3 },
  { name: '衣物鞋帽', color: '#6A1B9A', sort: 4 },
  { name: '药品保健', color: '#00838F', sort: 5 },
  { name: '数码家电', color: '#37474F', sort: 6 },
  { name: '文具办公', color: '#EF6C00', sort: 7 },
  { name: '其它', color: '#5D4037', sort: 8 },
];

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (exists) throw new ConflictException('账号已存在');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash,
        nickname: dto.nickname || dto.username,
        categories: {
          create: DEFAULT_CATEGORIES.map((c) => ({
            ...c,
            isSystem: true,
          })),
        },
      },
    });

    return this.tokenResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (!user) throw new UnauthorizedException('账号或密码错误');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('账号或密码错误');

    return this.tokenResponse(user);
  }

  private tokenResponse(user: {
    id: string;
    username: string;
    nickname: string | null;
  }) {
    const accessToken = this.jwt.sign({
      sub: user.id,
      username: user.username,
    });
    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
      },
    };
  }
}
