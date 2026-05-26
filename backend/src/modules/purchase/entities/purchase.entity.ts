import {
  Entity, Column, Index, ManyToOne, OneToMany, JoinColumn,
  CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn,
} from 'typeorm';
import { SupplierEntity } from './supplier.entity';

export enum PurchaseStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  RECEIVED = 'received',
  PARTIAL = 'partial',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid',
}

@Entity('purchases')
@Index(['businessId'])
export class PurchaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ nullable: true, name: 'supplier_id' })
  supplierId?: string;

  @ManyToOne(() => SupplierEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supplier_id' })
  supplier?: SupplierEntity;

  @Column({ name: 'warehouse_id' })
  warehouseId: string;

  @Column({ unique: false })
  invoiceNo: string;

  @Column({ type: 'date' })
  purchaseDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  shippingCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  grandTotal: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  dueAmount: number;

  @Column({ type: 'enum', enum: PurchaseStatus, default: PurchaseStatus.DRAFT })
  status: PurchaseStatus;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Column({ nullable: true })
  note?: string;

  @Column({ nullable: true })
  createdBy?: string;

  @OneToMany(() => PurchaseItemEntity, (item) => item.purchase, { cascade: true })
  items: PurchaseItemEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('purchase_items')
export class PurchaseItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'purchase_id' })
  purchaseId: string;

  @ManyToOne(() => PurchaseEntity, (p) => p.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_id' })
  purchase: PurchaseEntity;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  unitCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total: number;
}
