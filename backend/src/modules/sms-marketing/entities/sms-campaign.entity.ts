import { Column, Entity } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum TargetType {
  ALL_CUSTOMERS = 'all_customers',
  SPECIFIC_NUMBERS = 'specific_numbers',
  GROUP = 'group',
}

@Entity('sms_campaigns')
export class SmsCampaignEntity extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  templateId: string;

  @Column({ type: 'text' })
  messageContent: string;

  @Column({ type: 'enum', enum: TargetType, default: TargetType.ALL_CUSTOMERS })
  targetType: TargetType;

  @Column({ type: 'simple-array', nullable: true })
  recipientNumbers: string[];

  @Column({ nullable: true })
  groupId: string;

  @Column({ type: 'enum', enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status: CampaignStatus;

  @Column({ nullable: true, type: 'timestamp' })
  scheduledAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  sentAt: Date;

  @Column({ default: 0 })
  totalCount: number;

  @Column({ default: 0 })
  sentCount: number;

  @Column({ default: 0 })
  failedCount: number;

  @Column({ nullable: true })
  createdBy: string;
}
