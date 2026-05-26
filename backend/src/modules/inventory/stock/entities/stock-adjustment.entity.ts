import { Entity, Column, Index, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

export enum AdjustmentType {
  ADD = 'add',
  REMOVE = 'remove',
}

@Entity('stock_adjustments')
@Index(['businessId'])
export class StockAdjustmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'warehouse_id' })
  warehouseId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ type: 'enum', enum: AdjustmentType })
  type: AdjustmentType;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity: number;

  @Column({ nullable: true })
  reason?: string;

  @Column({ nullable: true })
  note?: string;

  @Column({ nullable: true })
  adjustedBy?: string;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  balanceBefore: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  balanceAfter: number;

  @CreateDateColumn()
  createdAt: Date;
}
