import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AdjustmentType } from '../entities/stock-adjustment.entity';

export class CreateAdjustmentDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  /**
   * Optional — if omitted the business-default location is used automatically.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsEnum(AdjustmentType)
  type: AdjustmentType;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateTransferDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  /**
   * Source — omit to use business-default location.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  fromWarehouseId?: string;

  /**
   * Destination — omit to use business-default location.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  toWarehouseId?: string;

  /**
   * Alternatively pass location IDs directly (takes priority over warehouse IDs).
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  fromLocationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  toLocationId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class GetStockLedgerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class GetAdjustmentsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class GetTransfersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
