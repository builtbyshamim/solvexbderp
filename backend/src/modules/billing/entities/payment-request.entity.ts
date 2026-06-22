import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { BusinessEntity } from 'src/modules/business/entities/business.entity';
import { PackageEntity } from 'src/modules/packages/entities/package.entity';

export enum PaymentMethod {
  BKASH  = 'bkash',
  ROCKET = 'rocket',
  NAGAD  = 'nagad',
}

export enum PaymentRequestStatus {
  PENDING  = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('payment_requests')
export class PaymentRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  businessId: string;

  @Column()
  packageId: string;

  @Column({ type: 'varchar', default: 'monthly' })
  billingCycle: string; // 'monthly' | 'yearly'

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column()
  senderMobile: string;

  @Column()
  transactionId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentRequestStatus, default: PaymentRequestStatus.PENDING })
  status: PaymentRequestStatus;

  @Column({ nullable: true, type: 'varchar' })
  adminNote: string | null;

  @Column({ nullable: true, type: 'varchar' })
  reviewedBy: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @ManyToOne(() => BusinessEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: BusinessEntity;

  @ManyToOne(() => PackageEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'packageId' })
  package: PackageEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
