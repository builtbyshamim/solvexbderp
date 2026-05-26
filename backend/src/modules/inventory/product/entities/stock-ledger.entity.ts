import { Entity, Column, Index, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

export enum StockTransactionType {
  OPENING = 'OPENING',
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  ADJUSTMENT_IN = 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  RETURN_IN = 'RETURN_IN',
  RETURN_OUT = 'RETURN_OUT',
}

@Entity('stock_ledger')
@Index(['businessId', 'productId'])
@Index(['businessId', 'warehouseId'])
export class StockLedgerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'warehouse_id' })
  warehouseId: string;

  @Column({ type: 'enum', enum: StockTransactionType })
  transactionType: StockTransactionType;

  @Column({ nullable: true })
  referenceType?: string;

  @Column({ nullable: true })
  referenceId?: string;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  qtyIn: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  qtyOut: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  balanceAfter: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  unitCost?: number;

  @Column({ nullable: true })
  note?: string;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt: Date;
}
