import {
  Entity, Column, Index, ManyToOne, OneToMany, JoinColumn,
  CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn,
} from 'typeorm';
import { PurchaseEntity } from './purchase.entity';
import { SupplierEntity } from './supplier.entity';

export enum ReturnStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('purchase_returns')
@Index(['businessId'])
export class PurchaseReturnEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'business_id' }) businessId: string;

  @Column({ name: 'purchase_id' }) purchaseId: string;
  @ManyToOne(() => PurchaseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_id' }) purchase: PurchaseEntity;

  @Column({ nullable: true, name: 'supplier_id' }) supplierId?: string;
  @ManyToOne(() => SupplierEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supplier_id' }) supplier?: SupplierEntity;

  @Column() referenceNo: string;
  @Column({ type: 'date' }) returnDate: Date;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) totalAmount: number;
  @Column({ type: 'enum', enum: ReturnStatus, default: ReturnStatus.PENDING }) status: ReturnStatus;
  @Column({ nullable: true }) reason?: string;
  @Column({ nullable: true }) note?: string;
  @Column({ nullable: true }) createdBy?: string;

  @OneToMany(() => PurchaseReturnItemEntity, (i) => i.purchaseReturn, { cascade: true })
  items: PurchaseReturnItemEntity[];

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity('purchase_return_items')
export class PurchaseReturnItemEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'purchase_return_id' }) purchaseReturnId: string;
  @ManyToOne(() => PurchaseReturnEntity, (r) => r.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_return_id' }) purchaseReturn: PurchaseReturnEntity;

  @Column({ name: 'product_id' }) productId: string;
  @Column({ nullable: true }) productName?: string;
  @Column({ type: 'decimal', precision: 15, scale: 4 }) quantity: number;
  @Column({ type: 'decimal', precision: 15, scale: 2 }) unitCost: number;
  @Column({ type: 'decimal', precision: 15, scale: 2 }) total: number;
}
