import { Entity, Column, Index, Unique } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

@Entity('customer_types')
@Index(['businessId'])
@Unique(['businessId', 'name'])
export class CustomerTypeEntity extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  colorCode?: string;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
