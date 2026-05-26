import { Entity, Column, OneToMany } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';
import { AccountLedgerEntity } from './account-ledger.entity';

export enum AccountType {
  CASH = 'cash',
  BANK = 'bank',
  MOBILE_BANKING = 'mobile_banking',
  RECEIVABLE = 'receivable',
  PAYABLE = 'payable',
  INCOME = 'income',
  EXPENSE = 'expense',
  EQUITY = 'equity',
}

@Entity('accounts')
export class AccountEntity extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ type: 'enum', enum: AccountType })
  accountType: AccountType;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  openingBalance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentBalance: number;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  bankName?: string;

  @Column({ nullable: true })
  accountNumber?: string;

  @OneToMany(() => AccountLedgerEntity, (l) => l.account)
  ledgers: AccountLedgerEntity[];
}
