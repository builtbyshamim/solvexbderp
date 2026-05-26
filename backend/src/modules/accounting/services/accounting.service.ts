import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import { AccountEntity, AccountType } from '../entities/account.entity';
import { AccountLedgerEntity, LedgerTransactionType } from '../entities/account-ledger.entity';
import {
  AccountTransferDto, CreateAccountDto, CreateExpenseDto,
  CreateIncomeDto, GetAccountsDto, GetLedgerDto, UpdateAccountDto,
} from '../dto/accounting.dto';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(AccountLedgerEntity)
    private readonly ledgerRepo: Repository<AccountLedgerEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Accounts ────────────────────────────────────────────────────────────

  async createAccount(businessId: string, dto: CreateAccountDto) {
    const exists = await this.accountRepo.findOne({ where: { businessId, name: ILike(dto.name) } });
    if (exists) throw new ConflictException('Account name already exists');

    const opening = dto.openingBalance ?? 0;
    const account = this.accountRepo.create({
      ...dto,
      businessId,
      openingBalance: opening,
      currentBalance: opening,
    });
    const saved = await this.accountRepo.save(account);

    if (opening > 0) {
      await this.ledgerRepo.save({
        businessId,
        accountId: saved.id,
        transactionDate: new Date(),
        transactionType: LedgerTransactionType.OPENING,
        debit: opening,
        credit: 0,
        balanceAfter: opening,
        note: 'Opening balance',
      });
    }

    return saved;
  }

  async findAllAccounts(businessId: string, query: GetAccountsDto) {
    const where: any = { businessId };
    if (query.accountType) where.accountType = query.accountType;
    if (query.search) where.name = ILike(`%${query.search}%`);
    return this.accountRepo.find({ where, order: { name: 'ASC' } });
  }

  async findAccount(businessId: string, id: string) {
    const a = await this.accountRepo.findOne({ where: { id, businessId } });
    if (!a) throw new NotFoundException('Account not found');
    return a;
  }

  async updateAccount(businessId: string, id: string, dto: UpdateAccountDto) {
    const a = await this.findAccount(businessId, id);
    Object.assign(a, dto);
    return this.accountRepo.save(a);
  }

  async deleteAccount(businessId: string, id: string) {
    const a = await this.findAccount(businessId, id);
    const hasLedger = await this.ledgerRepo.findOne({ where: { accountId: id } });
    if (hasLedger) throw new BadRequestException('Cannot delete account with ledger entries');
    await this.accountRepo.remove(a);
    return { message: 'Account deleted' };
  }

  // ─── Income ──────────────────────────────────────────────────────────────

  async recordIncome(businessId: string, userId: string, dto: CreateIncomeDto) {
    return this.dataSource.transaction(async (tx) => {
      const account = await tx.findOne(AccountEntity, { where: { id: dto.accountId, businessId } });
      if (!account) throw new NotFoundException('Account not found');

      const newBalance = Number(account.currentBalance) + Number(dto.amount);
      await tx.increment(AccountEntity, { id: account.id }, 'currentBalance', Number(dto.amount));

      return tx.save(AccountLedgerEntity, {
        businessId,
        accountId: account.id,
        transactionDate: new Date(dto.transactionDate),
        transactionType: LedgerTransactionType.INCOME,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        debit: dto.amount,
        credit: 0,
        balanceAfter: newBalance,
        note: dto.note,
        createdBy: userId,
      });
    });
  }

  // ─── Expense ─────────────────────────────────────────────────────────────

  async recordExpense(businessId: string, userId: string, dto: CreateExpenseDto) {
    return this.dataSource.transaction(async (tx) => {
      const account = await tx.findOne(AccountEntity, { where: { id: dto.accountId, businessId } });
      if (!account) throw new NotFoundException('Account not found');
      if (Number(account.currentBalance) < Number(dto.amount)) {
        throw new BadRequestException('Insufficient account balance');
      }

      const newBalance = Number(account.currentBalance) - Number(dto.amount);
      await tx.decrement(AccountEntity, { id: account.id }, 'currentBalance', Number(dto.amount));

      return tx.save(AccountLedgerEntity, {
        businessId,
        accountId: account.id,
        transactionDate: new Date(dto.transactionDate),
        transactionType: LedgerTransactionType.EXPENSE,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        debit: 0,
        credit: dto.amount,
        balanceAfter: newBalance,
        note: dto.note,
        createdBy: userId,
      });
    });
  }

  // ─── Transfer ─────────────────────────────────────────────────────────────

  async transferFunds(businessId: string, userId: string, dto: AccountTransferDto) {
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException('Cannot transfer to the same account');
    }
    return this.dataSource.transaction(async (tx) => {
      const from = await tx.findOne(AccountEntity, { where: { id: dto.fromAccountId, businessId } });
      const to = await tx.findOne(AccountEntity, { where: { id: dto.toAccountId, businessId } });
      if (!from || !to) throw new NotFoundException('Account not found');
      if (Number(from.currentBalance) < Number(dto.amount)) {
        throw new BadRequestException('Insufficient balance in source account');
      }

      const fromNew = Number(from.currentBalance) - Number(dto.amount);
      const toNew = Number(to.currentBalance) + Number(dto.amount);

      await tx.decrement(AccountEntity, { id: from.id }, 'currentBalance', Number(dto.amount));
      await tx.increment(AccountEntity, { id: to.id }, 'currentBalance', Number(dto.amount));

      const date = new Date(dto.transactionDate);
      await tx.save(AccountLedgerEntity, {
        businessId, accountId: from.id,
        transactionDate: date,
        transactionType: LedgerTransactionType.TRANSFER_OUT,
        referenceType: 'transfer', referenceId: to.id,
        debit: 0, credit: dto.amount, balanceAfter: fromNew,
        note: dto.note, createdBy: userId,
      });
      return tx.save(AccountLedgerEntity, {
        businessId, accountId: to.id,
        transactionDate: date,
        transactionType: LedgerTransactionType.TRANSFER_IN,
        referenceType: 'transfer', referenceId: from.id,
        debit: dto.amount, credit: 0, balanceAfter: toNew,
        note: dto.note, createdBy: userId,
      });
    });
  }

  // ─── Ledger Query ─────────────────────────────────────────────────────────

  async getLedger(businessId: string, query: GetLedgerDto) {
    const { accountId, dateFrom, dateTo, page = 1, limit = 20 } = query;
    const qb = this.ledgerRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.account', 'account')
      .where('l.businessId = :businessId', { businessId });

    if (accountId) qb.andWhere('l.accountId = :accountId', { accountId });
    if (dateFrom) qb.andWhere('l.transactionDate >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('l.transactionDate <= :dateTo', { dateTo });

    qb.orderBy('l.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, totalItems] = await qb.getManyAndCount();

    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  // ─── Reports ─────────────────────────────────────────────────────────────

  async getSummary(businessId: string) {
    const accounts = await this.accountRepo.find({ where: { businessId } });
    const summary = {
      totalCash: 0,
      totalBank: 0,
      totalMobileBanking: 0,
      totalAssets: 0,
      totalIncome: 0,
      totalExpense: 0,
    };
    for (const acc of accounts) {
      const bal = Number(acc.currentBalance);
      if (acc.accountType === AccountType.CASH) summary.totalCash += bal;
      else if (acc.accountType === AccountType.BANK) summary.totalBank += bal;
      else if (acc.accountType === AccountType.MOBILE_BANKING) summary.totalMobileBanking += bal;
    }
    summary.totalAssets = summary.totalCash + summary.totalBank + summary.totalMobileBanking;

    const [incRow] = await this.ledgerRepo.query(
      `SELECT COALESCE(SUM(debit), 0) as total FROM account_ledgers WHERE business_id = $1 AND transaction_type = $2`,
      [businessId, LedgerTransactionType.INCOME],
    );
    const [expRow] = await this.ledgerRepo.query(
      `SELECT COALESCE(SUM(credit), 0) as total FROM account_ledgers WHERE business_id = $1 AND transaction_type = $2`,
      [businessId, LedgerTransactionType.EXPENSE],
    );
    summary.totalIncome = Number(incRow?.total ?? 0);
    summary.totalExpense = Number(expRow?.total ?? 0);

    return { accounts, summary };
  }
}
