import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';
import { CustomerTypeEntity } from './customer-type.entity';

@Entity('customers')
@Index(['businessId', 'name'])
@Index(['businessId', 'phone'], { unique: true, where: '"phone" IS NOT NULL' })
export class CustomerEntity extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true, name: 'customer_type_id' })
  customerTypeId?: string;

  @ManyToOne(() => CustomerTypeEntity, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'customer_type_id' })
  customerType?: CustomerTypeEntity;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  openingBalance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentBalance: number;
}
