import { Column, Entity } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

export enum SmsTemplateCategory {
  PROMOTIONAL = 'promotional',
  TRANSACTIONAL = 'transactional',
  REMINDER = 'reminder',
  GREETING = 'greeting',
  OFFER = 'offer',
}

@Entity('sms_templates')
export class SmsTemplateEntity extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: SmsTemplateCategory, default: SmsTemplateCategory.PROMOTIONAL })
  category: SmsTemplateCategory;

  @Column({ default: 0 })
  characterCount: number;

  @Column({ nullable: true })
  usageCount: number;
}
