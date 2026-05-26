import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

@Entity('units')
@Index(['businessId', 'name'])
export class UnitEntity extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  shortName?: string;

  @Column({ nullable: true })
  description?: string;
}
