import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

export enum WarrantyType {
  DAYS = 'days',
  MONTHS = 'months',
  YEARS = 'years',
  LIFETIME = 'lifetime',
}

@Entity('warranties')
@Index(['businessId', 'name'])
export class WarrantyEntity extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ type: 'enum', enum: WarrantyType, default: WarrantyType.MONTHS })
  type: WarrantyType;

  @Column({ type: 'int', default: 0 })
  duration: number;

  @Column({ nullable: true })
  description?: string;
}
