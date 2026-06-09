import {
  IsString, IsBoolean, IsNumber, IsArray, IsOptional,
  Min, IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePackageDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() badge?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() highlight?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isEnterprise?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiProperty() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) monthlyPrice: number;
  @ApiProperty() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) yearlyPrice: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) trialDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() maxUsers?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() maxProducts?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() maxWarehouses?: number;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) features?: string[];
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
}

export class UpdatePackageDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() badge?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() highlight?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isEnterprise?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) monthlyPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) yearlyPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) trialDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() maxUsers?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() maxProducts?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() maxWarehouses?: number;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) features?: string[];
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
}
