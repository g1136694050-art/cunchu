import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  username: string;

  @IsString()
  @MinLength(3)
  @MaxLength(64)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  nickname?: string;
}

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
