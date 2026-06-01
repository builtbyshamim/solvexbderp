import {
  Entity, Column, Index, ManyToOne, OneToMany, JoinColumn,
  CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn,
} from 'typeorm';
import { SaleEntity } from './sale.entity';
import { CustomerEntity } from './customer.entity';

export enum ReturnStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('sale_returns')
@Index(['businessId'])
export class SaleReturnEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'business_id' }) businessId: string;

  @Column({ name: 'sale_id' }) saleId: string;
  @ManyToOne(() => SaleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' }) sale: SaleEntity;

  @Column({ nullable: true, name: 'customer_id' }) customerId?: string;
  @ManyToOne(() => CustomerEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' }) customer?: CustomerEntity;

  @Column() referenceNo: string;
  @Column({ type: 'date' }) returnDate: Date;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) totalAmount: number;
  @Column({ type: 'enum', enum: ReturnStatus, default: ReturnStatus.PENDING }) status: ReturnStatus;
  @Column({ nullable: true }) reason?: string;
  @Column({ nullable: true }) note?: string;
  @Column({ nullable: true }) createdBy?: string;

  @OneToMany(() => SaleReturnItemEntity, (i) => i.saleReturn, { cascade: true })
  items: SaleReturnItemEntity[];

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity('sale_return_items')
export class SaleReturnItemEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'sale_return_id' }) saleReturnId: string;
  @ManyToOne(() => SaleReturnEntity, (r) => r.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_return_id' }) saleReturn: SaleReturnEntity;

  @Column({ name: 'product_id' }) productId: string;
  @Column({ type: 'decimal', precision: 15, scale: 4 }) quantity: number;
  @Column({ type: 'decimal', precision: 15, scale: 2 }) unitPrice: number;
  @Column({ type: 'decimal', precision: 15, scale: 2 }) total: number;
}
