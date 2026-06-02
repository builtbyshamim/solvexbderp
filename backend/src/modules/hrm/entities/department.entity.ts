import { Entity, Column } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

@Entity('departments')
export class DepartmentEntity extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  head?: string;

  @Column({ nullable: true })
  description?: string;
}
