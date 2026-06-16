import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Min, IsNumber, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/** Converts string values from FormData to boolean */
const toBool = ({ value }: { value: any }): boolean | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 'active' || value === '1') return true;
  if (value === 'false' || value === 'inactive' || value === '0') return false;
  return Boolean(value);
};

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  isActive?: boolean;
}

export class GetCategoriesDto {
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
