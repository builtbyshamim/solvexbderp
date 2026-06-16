import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AffiliateEntity } from './affiliate.entity';

export enum PayoutStatus {
  PENDING   = 'pending',
  COMPLETED = 'completed',
  FAILED    = 'failed',
}

@Entity('affiliate_payouts')
export class AffiliatePayoutEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'affiliate_id' })
  affiliateId: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  method?: string;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  transactionRef?: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  note?: string;

  @ApiProperty({ enum: PayoutStatus })
  @Column({ type: 'enum', enum: PayoutStatus, default: PayoutStatus.COMPLETED })
  status: PayoutStatus;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  processedBy?: string;

  @ManyToOne(() => AffiliateEntity)
  @JoinColumn({ name: 'affiliate_id' })
  affiliate: AffiliateEntity;

  @CreateDateColumn()
  createdAt: Date;
}
