import {
  Entity, Column, ManyToOne, JoinColumn,
  PrimaryGeneratedColumn, CreateDateColumn, Index,
} from 'typeorm';
import { AccountEntity } from './account.entity';

export enum LedgerTransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  SALE_PAYMENT = 'sale_payment',
  PURCHASE_PAYMENT = 'purchase_payment',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  OPENING = 'opening',
  ADJUSTMENT = 'adjustment',
}

@Entity('account_ledgers')
@Index(['businessId', 'accountId'])
@Index(['businessId', 'transactionDate'])
export class AccountLedgerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'account_id' })
  accountId: string;

  @ManyToOne(() => AccountEntity, (a) => a.ledgers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: AccountEntity;

  @Column({ type: 'date', name: 'transaction_date' })
  transactionDate: Date;

  @Column({ type: 'enum', enum: LedgerTransactionType })
  transactionType: LedgerTransactionType;

  @Column({ nullable: true, name: 'reference_type' })
  referenceType?: string;

  @Column({ nullable: true, name: 'reference_id' })
  referenceId?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  debit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  credit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  balanceAfter: number;

  @Column({ nullable: true })
  note?: string;

  @Column({ nullable: true, name: 'created_by' })
  createdBy?: string;

  @CreateDateColumn()
  createdAt: Date;
}
