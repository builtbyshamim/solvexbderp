import {
  Entity, Column, Index, ManyToOne, OneToMany, JoinColumn,
  CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn,
} from 'typeorm';
import { CustomerEntity } from './customer.entity';

export enum QuotationStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CONVERTED = 'converted',
}

@Entity('quotations')
@Index(['businessId'])
export class QuotationEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'business_id' }) businessId: string;

  @Column({ nullable: true, name: 'customer_id' }) customerId?: string;
  @ManyToOne(() => CustomerEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' }) customer?: CustomerEntity;

  @Column() referenceNo: string;
  @Column({ type: 'date' }) quotationDate: Date;
  @Column({ type: 'date', nullable: true }) validUntil?: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) subtotal: number;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) discountAmount: number;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) taxAmount: number;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) grandTotal: number;

  @Column({ type: 'enum', enum: QuotationStatus, default: QuotationStatus.DRAFT }) status: QuotationStatus;
  @Column({ nullable: true }) note?: string;

  @OneToMany(() => QuotationItemEntity, (i) => i.quotation, { cascade: true })
  items: QuotationItemEntity[];

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity('quotation_items')
export class QuotationItemEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'quotation_id' }) quotationId: string;
  @ManyToOne(() => QuotationEntity, (q) => q.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quotation_id' }) quotation: QuotationEntity;

  @Column({ name: 'product_id' }) productId: string;
  @Column({ type: 'decimal', precision: 15, scale: 4 }) quantity: number;
  @Column({ type: 'decimal', precision: 15, scale: 2 }) unitPrice: number;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) discountAmount: number;
  @Column({ type: 'decimal', precision: 15, scale: 2 }) total: number;
}
