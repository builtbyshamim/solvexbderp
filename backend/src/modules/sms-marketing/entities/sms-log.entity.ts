import { Column, Entity } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

export enum SmsLogStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

@Entity('sms_logs')
export class SmsLogEntity extends TenantBaseEntity {
  @Column({ nullable: true })
  campaignId: string;

  @Column({ nullable: true })
  campaignName: string;

  @Column()
  recipientPhone: string;

  @Column({ nullable: true })
  recipientName: string;

  @Column({ type: 'text' })
  messageContent: string;

  @Column({ type: 'enum', enum: SmsLogStatus, default: SmsLogStatus.SENT })
  status: SmsLogStatus;

  @Column({ nullable: true, type: 'timestamp' })
  sentAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  deliveredAt: Date;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  sentBy: string;
}
