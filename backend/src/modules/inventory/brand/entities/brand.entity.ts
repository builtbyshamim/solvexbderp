import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

@Entity('brands')
@Index(['businessId', 'name'])
export class BrandEntity extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  logo?: string;

  @Column({ nullable: true })
  description?: string;
}
