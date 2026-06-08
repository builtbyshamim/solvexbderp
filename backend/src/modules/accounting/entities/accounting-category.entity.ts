import { Column, Entity, Unique } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

export enum AccountingCategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
  BOTH = 'both',
}

@Entity('accounting_categories')
@Unique(['businessId', 'name', 'type'])
export class AccountingCategoryEntity extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ type: 'enum', enum: AccountingCategoryType })
  type: AccountingCategoryType;

  @Column({ type: 'varchar', nullable: true })
  color: string | null;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;
}
