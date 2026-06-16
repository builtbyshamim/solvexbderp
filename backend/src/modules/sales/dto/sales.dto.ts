import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray, IsDateString, IsEnum, IsNotEmpty, IsNumber,
  IsOptional, IsString, IsUUID, Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Customer DTOs ────────────────────────────────────────────────────────────

export class CreateCustomerDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) openingBalance?: number;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
}

export class GetCustomersDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1) limit?: number;
}

// ─── Sale DTOs ─────────────────────────────────────────────────────────────────

export class PaymentEntryDto {
  @ApiProperty() @IsString() @IsNotEmpty() method: string;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) amount: number;
}

export class SaleItemDto {
  @ApiProperty() @IsUUID() productId: string;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0.0001) quantity: number;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) unitPrice: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) discountAmount?: number;
}

export class CreateSaleDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() warehouseId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() invoiceNo?: string;
  @ApiProperty() @IsDateString() saleDate: string;
  @ApiProperty({ type: [SaleItemDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => SaleItemDto) items: SaleItemDto[];
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) discountAmount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) taxAmount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) paidAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentMethod?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) deliveryCharge?: number;
  @ApiPropertyOptional() @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PaymentEntryDto) payments?: PaymentEntryDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() offerLabel?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class GetSalesDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentStatus?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dateTo?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1) limit?: number;
}

export class CollectPaymentDto {
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0.01) amount: number;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentMethod?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class CreateCustomerAdjustmentDto {
  @ApiProperty({ description: 'Adjustment date (ISO date)' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: ['debit', 'credit'], description: 'debit = they owe more, credit = they owe less' })
  @IsEnum(['debit', 'credit'])
  type: 'debit' | 'credit';

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

// ─── Quotation DTOs ───────────────────────────────────────────────────────────

export class QuotationItemDto {
  @ApiProperty() @IsUUID() productId: string;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0.0001) quantity: number;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) unitPrice: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) discountAmount?: number;
}

export class CreateQuotationDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() customerId?: string;
  @ApiProperty() @IsDateString() quotationDate: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() validUntil?: string;
  @ApiProperty({ type: [QuotationItemDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => QuotationItemDto) items: QuotationItemDto[];
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) discountAmount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) taxAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class UpdateQuotationStatusDto {
  @ApiProperty() @IsString() @IsNotEmpty() status: string;
}

export class ConvertQuotationDto {
  @ApiProperty() @IsUUID() warehouseId: string;
  @ApiProperty() @IsDateString() saleDate: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) paidAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentMethod?: string;
}

export class GetQuotationsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1) limit?: number;
}

// ─── Sale Return DTOs ─────────────────────────────────────────────────────────

export class ReturnItemDto {
  @ApiProperty() @IsUUID() productId: string;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0.0001) quantity: number;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) unitPrice: number;
}

export class CreateSaleReturnDto {
  @ApiProperty() @IsUUID() saleId: string;
  @ApiProperty() @IsDateString() returnDate: string;
  @ApiProperty({ type: [ReturnItemDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => ReturnItemDto) items: ReturnItemDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class GetSaleReturnsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1) limit?: number;
}

export class GetCustomerStatementDto {
  @ApiPropertyOptional() @IsOptional() @IsString() dateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dateTo?: string;
}
