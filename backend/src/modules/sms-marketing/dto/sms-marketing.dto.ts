import {
  IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsDateString, IsNumber,
  IsBoolean, IsUUID, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SmsTemplateCategory } from '../entities/sms-template.entity';
import { TargetType } from '../entities/sms-campaign.entity';
import { SmsProvider } from '../entities/sms-config.entity';

// ── Templates ────────────────────────────────────────────────────────────────

export class CreateSmsTemplateDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsString() @IsNotEmpty()
  content: string;

  @IsOptional() @IsEnum(SmsTemplateCategory)
  category?: SmsTemplateCategory;
}

export class UpdateSmsTemplateDto {
  @IsOptional() @IsString() @IsNotEmpty()
  name?: string;

  @IsOptional() @IsString() @IsNotEmpty()
  content?: string;

  @IsOptional() @IsEnum(SmsTemplateCategory)
  category?: SmsTemplateCategory;
}

export class GetSmsTemplatesDto {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString()
  category?: string;

  @IsOptional() @Type(() => Number) @IsNumber()
  page?: number;

  @IsOptional() @Type(() => Number) @IsNumber()
  limit?: number;
}

// ── Campaigns ────────────────────────────────────────────────────────────────

export class CreateSmsCampaignDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  templateId?: string;

  @IsString() @IsNotEmpty()
  messageContent: string;

  @IsEnum(TargetType)
  targetType: TargetType;

  @IsOptional() @IsArray() @IsString({ each: true })
  recipientNumbers?: string[];

  @IsOptional() @IsString()
  groupId?: string;

  @IsOptional() @IsDateString()
  scheduledAt?: string;
}

export class UpdateSmsCampaignDto {
  @IsOptional() @IsString() @IsNotEmpty()
  name?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  messageContent?: string;

  @IsOptional() @IsEnum(TargetType)
  targetType?: TargetType;

  @IsOptional() @IsArray() @IsString({ each: true })
  recipientNumbers?: string[];

  @IsOptional() @IsString()
  groupId?: string;

  @IsOptional() @IsDateString()
  scheduledAt?: string;
}

export class GetSmsCampaignsDto {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsString()
  dateFrom?: string;

  @IsOptional() @IsString()
  dateTo?: string;

  @IsOptional() @Type(() => Number) @IsNumber()
  page?: number;

  @IsOptional() @Type(() => Number) @IsNumber()
  limit?: number;
}

// ── Quick Send ───────────────────────────────────────────────────────────────

export class QuickSendSmsDto {
  @IsString() @IsNotEmpty()
  message: string;

  @IsArray() @IsString({ each: true })
  phoneNumbers: string[];

  @IsOptional() @IsString()
  recipientName?: string;
}

// ── Logs ─────────────────────────────────────────────────────────────────────

export class GetSmsLogsDto {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsString()
  campaignId?: string;

  @IsOptional() @IsString()
  dateFrom?: string;

  @IsOptional() @IsString()
  dateTo?: string;

  @IsOptional() @Type(() => Number) @IsNumber()
  page?: number;

  @IsOptional() @Type(() => Number) @IsNumber()
  limit?: number;
}

// ── Groups ───────────────────────────────────────────────────────────────────

export class CreateSmsGroupDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsOptional() @IsString()
  description?: string;
}

export class UpdateSmsGroupDto {
  @IsOptional() @IsString() @IsNotEmpty()
  name?: string;

  @IsOptional() @IsString()
  description?: string;
}

export class AddGroupMembersDto {
  @IsArray()
  members: { phone: string; name?: string; customerId?: string }[];
}

export class GetSmsGroupsDto {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @Type(() => Number) @IsNumber()
  page?: number;

  @IsOptional() @Type(() => Number) @IsNumber()
  limit?: number;
}

export class GetGroupMembersDto {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @Type(() => Number) @IsNumber()
  page?: number;

  @IsOptional() @Type(() => Number) @IsNumber()
  limit?: number;
}

// ── Configuration ─────────────────────────────────────────────────────────────

export class SaveSmsConfigDto {
  @IsEnum(SmsProvider)
  provider: SmsProvider;

  @IsOptional() @IsString()
  apiKey?: string;

  @IsOptional() @IsString()
  apiSecret?: string;

  @IsOptional() @IsString()
  senderId?: string;

  @IsOptional() @IsString()
  apiUrl?: string;

  @IsOptional() @IsBoolean()
  testMode?: boolean;
}

export class TestSmsDto {
  @IsString() @IsNotEmpty()
  phone: string;

  @IsOptional() @IsString()
  message?: string;
}

// ── Packages & Credits ────────────────────────────────────────────────────────

export class PurchasePackageDto {
  @IsString() @IsNotEmpty()
  packageId: string;

  @IsOptional() @IsString()
  paymentReference?: string;
}

// ── Due Reminder ─────────────────────────────────────────────────────────────

export class CreateDueReminderDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsString() @IsNotEmpty()
  message: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  triggerDays?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  minAmount?: number;

  @IsOptional() @IsBoolean()
  sendToAllDue?: boolean;
}

export class UpdateDueReminderDto {
  @IsOptional() @IsString() @IsNotEmpty()
  name?: string;

  @IsOptional() @IsString() @IsNotEmpty()
  message?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  triggerDays?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  minAmount?: number;

  @IsOptional() @IsBoolean()
  sendToAllDue?: boolean;
}

export class GetDueReminderLogsDto {
  @IsOptional() @IsString()
  reminderId?: string;

  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString()
  dateFrom?: string;

  @IsOptional() @IsString()
  dateTo?: string;

  @IsOptional() @Type(() => Number) @IsNumber()
  page?: number;

  @IsOptional() @Type(() => Number) @IsNumber()
  limit?: number;
}
