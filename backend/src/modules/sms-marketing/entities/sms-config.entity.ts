import { Column, Entity } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

export enum SmsProvider {
  SSL_WIRELESS = 'ssl_wireless',
  TWILIO = 'twilio',
  NEXMO = 'nexmo',
  ALPHA_NET = 'alpha_net',
  CUSTOM = 'custom',
}

@Entity('sms_configs')
export class SmsConfigEntity extends TenantBaseEntity {
  @Column({ type: 'enum', enum: SmsProvider, default: SmsProvider.SSL_WIRELESS })
  provider: SmsProvider;

  @Column({ nullable: true })
  apiKey: string;

  @Column({ nullable: true })
  apiSecret: string;

  @Column({ nullable: true })
  senderId: string;

  @Column({ nullable: true })
  apiUrl: string;

  @Column({ default: false })
  testMode: boolean;

  @Column({ default: true })
  isConfigured: boolean;
}
