import {
  IsEnum, IsIn, IsInt, IsNumber, IsOptional,
  IsPositive, IsString, Min, MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/payment-request.entity';

export class CreatePaymentRequestDto {
  @ApiProperty({ example: 'package-uuid' })
  @IsString()
  packageId: string;

  @ApiProperty({ enum: ['monthly', 'yearly'] })
  @IsIn(['monthly', 'yearly'])
  billingCycle: 'monthly' | 'yearly';

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: '01712345678' })
  @IsString()
  @MinLength(11)
  senderMobile: string;

  @ApiProperty({ example: 'TRX8AP12345678' })
  @IsString()
  @MinLength(4)
  transactionId: string;

  @ApiProperty({ example: 500 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;
}

export class ReviewPaymentRequestDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsIn(['approved', 'rejected'])
  action: 'approved' | 'rejected';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNote?: string;
}

export class GetPaymentRequestsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected', 'all'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
