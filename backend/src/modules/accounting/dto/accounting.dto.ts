import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString,
  IsUUID, IsDateString, Min, IsHexColor,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AccountType } from '../entities/account.entity';
import { AccountingCategoryType } from '../entities/accounting-category.entity';

// ── Accounting Categories ─────────────────────────────────────────────────────

export class CreateAccountingCategoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: AccountingCategoryType })
  @IsEnum(AccountingCategoryType)
  type: AccountingCategoryType;

  @ApiPropertyOptional({ description: 'Hex color e.g. #3b82f6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateAccountingCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class GetAccountingCategoriesDto {
  @ApiPropertyOptional({ enum: AccountingCategoryType })
  @IsOptional()
  @IsEnum(AccountingCategoryType)
  type?: AccountingCategoryType;
}

export class CreateAccountDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  openingBalance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountNumber?: string;
}

export class UpdateAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountNumber?: string;
}

export class CreateIncomeDto {
  @ApiProperty()
  @IsUUID()
  accountId: string;

  @ApiProperty()
  @IsDateString()
  transactionDate: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateExpenseDto {
  @ApiProperty()
  @IsUUID()
  accountId: string;

  @ApiProperty()
  @IsDateString()
  transactionDate: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class AccountTransferDto {
  @ApiProperty()
  @IsUUID()
  fromAccountId: string;

  @ApiProperty()
  @IsUUID()
  toAccountId: string;

  @ApiProperty()
  @IsDateString()
  transactionDate: string;

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

export class GetLedgerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  accountId?: string;

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

export class GetAccountsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class GetTransactionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

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

export class GetReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateTo?: string;
}
