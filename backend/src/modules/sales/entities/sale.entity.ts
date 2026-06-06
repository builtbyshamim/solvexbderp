import {
  Entity, Column, Index, ManyToOne, OneToMany, JoinColumn,
  CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn,
} from 'typeorm';
import { CustomerEntity } from './customer.entity';

export enum SaleStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid',
}

@Entity('sales')
@Index(['businessId'])
export class SaleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ nullable: true, name: 'customer_id' })
  customerId?: string;

  @ManyToOne(() => CustomerEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer?: CustomerEntity;

  @Column({ nullable: true, name: 'warehouse_id' })
  warehouseId?: string;

  @Column()
  invoiceNo: string;

  @Column({ type: 'date' })
  saleDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  grandTotal: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  dueAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalProfit: number;

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.CONFIRMED })
  status: SaleStatus;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  deliveryCharge: number;

  @Column({ nullable: true })
  paymentMethod?: string;

  @Column({ type: 'jsonb', nullable: true })
  payments?: { method: string; amount: number }[];

  @Column({ nullable: true })
  offerLabel?: string;

  @Column({ nullable: true })
  note?: string;

  @Column({ nullable: true })
  createdBy?: string;

  @OneToMany(() => SaleItemEntity, (item) => item.sale, { cascade: true })
  items: SaleItemEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('sale_items')
export class SaleItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sale_id' })
  saleId: string;

  @ManyToOne(() => SaleEntity, (s) => s.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: SaleEntity;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  costPrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  profit: number;
}
