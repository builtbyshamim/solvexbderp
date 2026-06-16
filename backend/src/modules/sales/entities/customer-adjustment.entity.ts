import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

export enum AdjustmentType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

@Entity('customer_ledger_adjustments')
@Index(['businessId', 'customerId'])
export class CustomerLedgerAdjustmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'enum', enum: AdjustmentType })
  type: AdjustmentType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  note?: string;

  @Column({ nullable: true, name: 'created_by' })
  createdBy?: string;

  @CreateDateColumn()
  createdAt: Date;
}
