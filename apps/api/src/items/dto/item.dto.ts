import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateItemDto {
  @IsString()
  @MaxLength(64)
  name: string;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsDateString()
  expireAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  spec?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;
}

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  locationId?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number | null;

  @IsOptional()
  @IsDateString()
  expireAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  spec?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string | null;

  @IsOptional()
  @IsString()
  coverUrl?: string | null;
}

export class StockChangeDto {
  @IsNumber()
  delta: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
