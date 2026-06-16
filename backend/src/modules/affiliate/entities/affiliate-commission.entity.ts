import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AffiliateEntity } from './affiliate.entity';
import { AffiliateReferralEntity } from './affiliate-referral.entity';

export enum CommissionStatus {
  PENDING   = 'pending',
  APPROVED  = 'approved',
  PAID      = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('affiliate_commissions')
export class AffiliateCommissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'affiliate_id' })
  affiliateId: string;

  @ApiProperty()
  @Column({ name: 'referral_id' })
  referralId: string;

  @ApiProperty()
  @Column({ type: 'int' })
  month: number;

  @ApiProperty()
  @Column({ type: 'int' })
  year: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  subscriptionAmount: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  commissionRate: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  commissionAmount: number;

  @ApiProperty({ enum: CommissionStatus })
  @Column({ type: 'enum', enum: CommissionStatus, default: CommissionStatus.PENDING })
  status: CommissionStatus;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  note?: string;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  approvedBy?: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @ManyToOne(() => AffiliateEntity)
  @JoinColumn({ name: 'affiliate_id' })
  affiliate: AffiliateEntity;

  @ManyToOne(() => AffiliateReferralEntity, { eager: true })
  @JoinColumn({ name: 'referral_id' })
  referral: AffiliateReferralEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
