import { Entity, Column, Index, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

export enum TransferStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
}

@Entity('stock_transfers')
@Index(['businessId'])
export class StockTransferEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'from_warehouse_id' })
  fromWarehouseId: string;

  @Column({ name: 'to_warehouse_id' })
  toWarehouseId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity: number;

  @Column({ type: 'enum', enum: TransferStatus, default: TransferStatus.PENDING })
  status: TransferStatus;

  @Column({ nullable: true })
  note?: string;

  @Column({ nullable: true })
  createdBy?: string;

  @Column({ nullable: true })
  approvedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
