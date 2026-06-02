import { Entity, Column, Index, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

export enum StockTransactionType {
  OPENING         = 'OPENING',
  PURCHASE        = 'PURCHASE',
  PURCHASE_RETURN = 'PURCHASE_RETURN',
  SALE            = 'SALE',
  SALE_RETURN     = 'SALE_RETURN',
  ADJUSTMENT_IN   = 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT  = 'ADJUSTMENT_OUT',
  TRANSFER_IN     = 'TRANSFER_IN',
  TRANSFER_OUT    = 'TRANSFER_OUT',
  DAMAGED         = 'DAMAGED',
  LOST            = 'LOST',
  RETURN_IN       = 'RETURN_IN',
  RETURN_OUT      = 'RETURN_OUT',
}

@Entity('stock_ledger')
@Index(['businessId', 'productId'])
@Index(['businessId', 'locationId'])
@Index(['businessId', 'referenceType', 'referenceId'])
export class StockLedgerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'product_id' })
  productId: string;

  /**
   * References stock_locations.id — replaces warehouseId.
   * Every ledger entry belongs to a location (business default or warehouse).
   */
  @Column({ name: 'location_id' })
  locationId: string;

  @Column({ type: 'enum', enum: StockTransactionType })
  transactionType: StockTransactionType;

  @Column({ name: 'reference_type', nullable: true })
  referenceType?: string;

  @Column({ name: 'reference_id', nullable: true })
  referenceId?: string;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  qtyIn: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  qtyOut: number;

  @Column({ name: 'balance_after', type: 'decimal', precision: 15, scale: 4, default: 0 })
  balanceAfter: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 15, scale: 2, nullable: true })
  unitCost?: number;

  @Column({ name: 'total_cost', type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalCost?: number;

  @Column({ nullable: true })
  note?: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
