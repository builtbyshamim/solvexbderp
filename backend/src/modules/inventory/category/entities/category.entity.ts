import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

@Entity('categories')
@Index(['businessId', 'name'])
export class CategoryEntity extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ nullable: true })
  description?: string;

  /** Optional parent category for tree structure */
  @Column({ name: 'parent_id', nullable: true, type: 'uuid' })
  parentId?: string | null;
}
