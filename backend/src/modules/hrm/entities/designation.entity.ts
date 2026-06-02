import { Entity, Column } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

@Entity('designations')
export class DesignationEntity extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true })
  description?: string;
}
