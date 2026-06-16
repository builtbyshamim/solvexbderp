import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

export enum AdjustmentType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

@Entity('supplier_ledger_adjustments')
@Index(['businessId', 'supplierId'])
export class SupplierLedgerAdjustmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'supplier_id' })
  supplierId: string;

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
