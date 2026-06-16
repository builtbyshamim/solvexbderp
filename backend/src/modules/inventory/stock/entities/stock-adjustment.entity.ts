import { Entity, Column, Index, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

export enum AdjustmentType {
  ADD     = 'add',
  REMOVE  = 'remove',
  DAMAGED = 'damaged',
  LOST    = 'lost',
}

@Entity('stock_adjustments')
@Index(['businessId'])
@Index(['businessId', 'productId'])
export class StockAdjustmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  /**
   * References stock_locations.id.
   * If no warehouse selected, this points to the business-default location.
   */
  @Column({ name: 'location_id' })
  locationId: string;

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

  @Column({ name: 'balance_before', type: 'decimal', precision: 15, scale: 4, default: 0 })
  balanceBefore: number;

  @Column({ name: 'balance_after', type: 'decimal', precision: 15, scale: 4, default: 0 })
  balanceAfter: number;

  @Column({ name: 'adjusted_by', nullable: true })
  adjustedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
