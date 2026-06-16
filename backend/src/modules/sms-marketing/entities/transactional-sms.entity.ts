import { Column, Entity, Unique } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

export enum TransactionalSmsEvent {
  SALE_CREATED = 'sale_created',
  PAYMENT_RECEIVED = 'payment_received',
  SALE_RETURN = 'sale_return',
}

export const DEFAULT_TEMPLATES: Record<TransactionalSmsEvent, string> = {
  [TransactionalSmsEvent.SALE_CREATED]:
    'Dear {{customer_name}}, Invoice #{{invoice_no}} created. Total: ৳{{total_amount}} | Paid: ৳{{paid_amount}} | Due: ৳{{due_amount}}. {{invoice_link}} -{{business_name}}',
  [TransactionalSmsEvent.PAYMENT_RECEIVED]:
    'Dear {{customer_name}}, ৳{{payment_amount}} received for Invoice #{{invoice_no}}. Remaining due: ৳{{due_amount}}. Thank you! -{{business_name}}',
  [TransactionalSmsEvent.SALE_RETURN]:
    'Dear {{customer_name}}, return of ৳{{return_amount}} processed for Invoice #{{invoice_no}}. -{{business_name}}',
};

export const EVENT_LABELS: Record<TransactionalSmsEvent, string> = {
  [TransactionalSmsEvent.SALE_CREATED]: 'Sale Created',
  [TransactionalSmsEvent.PAYMENT_RECEIVED]: 'Payment Received',
  [TransactionalSmsEvent.SALE_RETURN]: 'Sale Return',
};

export const EVENT_VARIABLES: Record<TransactionalSmsEvent, string[]> = {
  [TransactionalSmsEvent.SALE_CREATED]: [
    'customer_name', 'invoice_no', 'invoice_link',
    'total_amount', 'paid_amount', 'due_amount',
    'sale_date', 'business_name',
  ],
  [TransactionalSmsEvent.PAYMENT_RECEIVED]: [
    'customer_name', 'invoice_no', 'payment_amount',
    'paid_amount', 'due_amount', 'business_name',
  ],
  [TransactionalSmsEvent.SALE_RETURN]: [
    'customer_name', 'invoice_no', 'return_amount', 'business_name',
  ],
};

@Entity('transactional_sms_settings')
@Unique(['businessId', 'event'])
export class TransactionalSmsSettingEntity extends TenantBaseEntity {
  @Column({ type: 'enum', enum: TransactionalSmsEvent })
  event: TransactionalSmsEvent;

  @Column({ default: false })
  isEnabled: boolean;

  @Column({ type: 'text' })
  template: string;
}
