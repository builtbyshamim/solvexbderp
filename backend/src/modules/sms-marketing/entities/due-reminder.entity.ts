import { Column, Entity } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

export enum ReminderStatus {
  SENT = 'sent',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

@Entity('due_reminders')
export class DueReminderEntity extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'int', default: 0 })
  triggerDays: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  minAmount: number;

  @Column({ default: true })
  sendToAllDue: boolean;

  @Column({ nullable: true })
  lastRunAt: Date;

  @Column({ default: 0 })
  totalSent: number;
}

@Entity('due_reminder_logs')
export class DueReminderLogEntity extends TenantBaseEntity {
  @Column()
  reminderId: string;

  @Column()
  reminderName: string;

  @Column({ nullable: true })
  customerId: string;

  @Column()
  customerName: string;

  @Column()
  phone: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  dueAmount: number;

  @Column({ type: 'text' })
  messageContent: string;

  @Column({ type: 'enum', enum: ReminderStatus, default: ReminderStatus.SENT })
  status: ReminderStatus;

  @Column({ nullable: true, type: 'timestamp' })
  sentAt: Date;

  @Column({ nullable: true })
  errorMessage: string;
}
