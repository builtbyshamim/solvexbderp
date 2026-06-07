import {
  IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min, IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AffiliateStatus } from '../entities/affiliate.entity';
import { CommissionStatus } from '../entities/affiliate-commission.entity';
import { PayoutStatus } from '../entities/affiliate-payout.entity';
import { Type } from 'class-transformer';

export class ApplyAffiliateDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  bankAccount?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  bankAccountName?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  mobileBank?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  mobileBankNumber?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;
}

export class UpdateAffiliateStatusDto {
  @ApiProperty({ enum: AffiliateStatus })
  @IsEnum(AffiliateStatus)
  status: AffiliateStatus;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;
}

export class UpdateCommissionRateDto {
  @ApiProperty({ example: 10 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0) @Max(100)
  commissionRate: number;
}

export class RecordCommissionDto {
  @ApiProperty()
  @IsUUID()
  affiliateId: string;

  @ApiProperty()
  @IsUUID()
  referralId: string;

  @ApiProperty({ example: 1 })
  @IsInt() @Min(1) @Max(12)
  month: number;

  @ApiProperty({ example: 2025 })
  @IsInt() @Min(2020)
  year: number;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subscriptionAmount: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  note?: string;
}

export class GenerateMonthlyCommissionsDto {
  @ApiProperty({ example: 1 })
  @IsInt() @Min(1) @Max(12)
  month: number;

  @ApiProperty({ example: 2025 })
  @IsInt() @Min(2020)
  year: number;

  @ApiProperty({ description: 'Subscription amount per referral (e.g., 500 for Starter, 1200 for Pro)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subscriptionAmount: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  note?: string;
}

export class UpdateCommissionStatusDto {
  @ApiProperty({ enum: [CommissionStatus.APPROVED, CommissionStatus.CANCELLED, CommissionStatus.PAID] })
  @IsEnum(CommissionStatus)
  status: CommissionStatus;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  note?: string;
}

export class CreatePayoutDto {
  @ApiProperty()
  @IsUUID()
  affiliateId: string;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  method?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  transactionRef?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  note?: string;
}

export class AffiliateQueryDto {
  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: AffiliateStatus })
  @IsOptional() @IsEnum(AffiliateStatus)
  status?: AffiliateStatus;
}

export class CommissionQueryDto {
  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  affiliateId?: string;

  @ApiPropertyOptional({ enum: CommissionStatus })
  @IsOptional() @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt()
  month?: number;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt()
  year?: number;
}
