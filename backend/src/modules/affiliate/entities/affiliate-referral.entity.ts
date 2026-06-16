import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AffiliateEntity } from './affiliate.entity';

@Entity('affiliate_referrals')
export class AffiliateReferralEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'affiliate_id' })
  affiliateId: string;

  @ApiProperty()
  @Column({ name: 'referred_user_id', unique: true })
  referredUserId: string;

  @ApiProperty({ nullable: true })
  @Column({ name: 'referred_business_id', nullable: true })
  referredBusinessId?: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monthlySubscriptionAmount: number;

  @ApiProperty()
  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => AffiliateEntity)
  @JoinColumn({ name: 'affiliate_id' })
  affiliate: AffiliateEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
