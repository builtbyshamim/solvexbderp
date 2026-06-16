import { IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class GetBusinessesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['all', 'active', 'suspended'])
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export class ToggleStatusDto {
  @IsIn(['active', 'suspended'])
  status: 'active' | 'suspended';

  @IsOptional()
  @IsString()
  reason?: string;
}

export class SubscriptionActionDto {
  @IsIn(['renew', 'change_plan', 'suspend', 'unsuspend', 'extend_trial'])
  action: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  extend_months?: number;

  @IsOptional()
  @IsString()
  plan_id?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsInt()
  extra_days?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ResetBusinessDto {
  @IsString()
  confirm_text: string;

  @IsIn(['all_data', 'transactions_only', 'inventory_only', 'hrm_only', 'accounting_only'])
  reset_scope: string;

  @IsOptional()
  @IsString()
  note?: string;
}
