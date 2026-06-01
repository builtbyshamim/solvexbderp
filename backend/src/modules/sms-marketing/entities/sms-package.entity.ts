import { Column, Entity } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

@Entity('sms_packages')
export class SmsPackageEntity {
  @Column({ primary: true, generated: 'uuid' })
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'int' })
  smsCount: number;

  @Column({ type: 'int', default: 0 })
  bonusSms: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 30 })
  validityDays: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPopular: boolean;

  @Column({ nullable: true })
  color: string;
}

@Entity('sms_credits')
export class SmsCreditEntity extends TenantBaseEntity {
  @Column({ nullable: true })
  packageId: string;

  @Column({ nullable: true })
  packageName: string;

  @Column({ type: 'int', default: 0 })
  totalCredits: number;

  @Column({ type: 'int', default: 0 })
  usedCredits: number;

  @Column({ type: 'int', default: 0 })
  remainingCredits: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountPaid: number;

  @Column({ nullable: true, type: 'timestamp' })
  expiresAt: Date;

  @Column({ nullable: true })
  purchasedBy: string;
}
