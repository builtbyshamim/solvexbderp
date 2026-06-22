import {
  Column, CreateDateColumn, Entity,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity('coupons')
export class CouponEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column()
  code: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ name: 'discount_type', type: 'enum', enum: DiscountType })
  discountType: DiscountType;

  @Column({ name: 'discount_value', type: 'decimal', precision: 15, scale: 2 })
  discountValue: number;

  @Column({ name: 'min_order_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  minOrderAmount: number;

  @Column({ name: 'max_discount_amount', type: 'decimal', precision: 15, scale: 2, nullable: true })
  maxDiscountAmount: number | null;

  @Column({ name: 'usage_limit', nullable: true, type: 'int' })
  usageLimit: number | null;

  @Column({ name: 'used_count', default: 0 })
  usedCount: number;

  @Column({ name: 'expires_at', nullable: true, type: 'timestamptz' })
  expiresAt: Date | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
