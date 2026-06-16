import { Entity, Column, Index, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

export enum TransferStatus {
  PENDING   = 'pending',
  APPROVED  = 'approved',
  CANCELLED = 'cancelled',
}

@Entity('stock_transfers')
@Index(['businessId'])
@Index(['businessId', 'productId'])
export class StockTransferEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  /**
   * Source location (stock_locations.id).
   * Can be business-default or a warehouse location.
   */
  @Column({ name: 'from_location_id' })
  fromLocationId: string;

  /**
   * Destination location (stock_locations.id).
   */
  @Column({ name: 'to_location_id' })
  toLocationId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity: number;

  @Column({ type: 'enum', enum: TransferStatus, default: TransferStatus.PENDING })
  status: TransferStatus;

  @Column({ nullable: true })
  note?: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
