import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, In, Repository } from 'typeorm';
import { AccountEntity, AccountType } from '../entities/account.entity';
import {
  AccountLedgerEntity,
  LedgerTransactionType,
} from '../entities/account-ledger.entity';
import {
  AccountingCategoryEntity,
  AccountingCategoryType,
} from '../entities/accounting-category.entity';
import {
  AccountTransferDto,
  CreateAccountDto,
  CreateExpenseDto,
  CreateIncomeDto,
  GetAccountsDto,
  GetLedgerDto,
  GetReportDto,
  GetTransactionsDto,
  UpdateAccountDto,
  CreateAccountingCategoryDto,
  UpdateAccountingCategoryDto,
  GetAccountingCategoriesDto,
} from '../dto/accounting.dto';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(AccountLedgerEntity)
    private readonly ledgerRepo: Repository<AccountLedgerEntity>,
    @InjectRepository(AccountingCategoryEntity)
    private readonly categoryRepo: Repository<AccountingCategoryEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Accounting Categories ────────────────────────────────────────────────

  async createCategory(businessId: string, dto: CreateAccountingCategoryDto) {
    const exists = await this.categoryRepo.findOne({
      where: { businessId, name: ILike(dto.name), type: dto.type },
    });
    if (exists) throw new ConflictException('Category already exists');
    return this.categoryRepo.save(
      this.categoryRepo.create({ ...dto, businessId }),
    );
  }

  async getCategories(businessId: string, dto: GetAccountingCategoriesDto) {
    const where: any = { businessId };
    if (dto.type) {
      where['type'] = In([dto.type, AccountingCategoryType.BOTH]);
    }
    return this.categoryRepo.find({ where, order: { name: 'ASC' } });
  }

  async updateCategory(
    businessId: string,
    id: string,
    dto: UpdateAccountingCategoryDto,
  ) {
    const cat = await this.categoryRepo.findOne({ where: { id, businessId } });
    if (!cat) throw new NotFoundException('Category not found');
    Object.assign(cat, dto);
    return this.categoryRepo.save(cat);
  }

  async deleteCategory(businessId: string, id: string) {
    const cat = await this.categoryRepo.findOne({ where: { id, businessId } });
    if (!cat) throw new NotFoundException('Category not found');
    await this.categoryRepo.remove(cat);
    return { message: 'Category deleted' };
  }

  // ─── Accounts ────────────────────────────────────────────────────────────

  async createAccount(businessId: string, dto: CreateAccountDto) {
    const exists = await this.accountRepo.findOne({
      where: { businessId, name: ILike(dto.name) },
    });
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
    const hasLedger = await this.ledgerRepo.findOne({
      where: { accountId: id },
    });
    if (hasLedger)
      throw new BadRequestException(
        'Cannot delete account with ledger entries',
      );
    await this.accountRepo.remove(a);
    return { message: 'Account deleted' };
  }

  // ─── Income ──────────────────────────────────────────────────────────────

  async recordIncome(businessId: string, userId: string, dto: CreateIncomeDto) {
    return this.dataSource.transaction(async (tx) => {
      const account = await tx.findOne(AccountEntity, {
        where: { id: dto.accountId, businessId },
      });
      if (!account) throw new NotFoundException('Account not found');

      const newBalance = Number(account.currentBalance) + Number(dto.amount);
      await tx.increment(
        AccountEntity,
        { id: account.id },
        'currentBalance',
        Number(dto.amount),
      );

      return tx.save(AccountLedgerEntity, {
        businessId,
        accountId: account.id,
        transactionDate: new Date(dto.transactionDate),
        transactionType: LedgerTransactionType.INCOME,
        category: dto.category,
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

  async getIncomes(businessId: string, dto: GetTransactionsDto) {
    return this.getTransactions(businessId, {
      ...dto,
      transactionType: LedgerTransactionType.INCOME,
    });
  }

  // ─── Expense ─────────────────────────────────────────────────────────────

  async recordExpense(
    businessId: string,
    userId: string,
    dto: CreateExpenseDto,
  ) {
    return this.dataSource.transaction(async (tx) => {
      const account = await tx.findOne(AccountEntity, {
        where: { id: dto.accountId, businessId },
      });
      if (!account) throw new NotFoundException('Account not found');
      if (Number(account.currentBalance) < Number(dto.amount)) {
        throw new BadRequestException('Insufficient account balance');
      }

      const newBalance = Number(account.currentBalance) - Number(dto.amount);
      await tx.decrement(
        AccountEntity,
        { id: account.id },
        'currentBalance',
        Number(dto.amount),
      );

      return tx.save(AccountLedgerEntity, {
        businessId,
        accountId: account.id,
        transactionDate: new Date(dto.transactionDate),
        transactionType: LedgerTransactionType.EXPENSE,
        category: dto.category,
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

  async getExpenses(businessId: string, dto: GetTransactionsDto) {
    return this.getTransactions(businessId, {
      ...dto,
      transactionType: LedgerTransactionType.EXPENSE,
    });
  }

  // ─── Transfer ─────────────────────────────────────────────────────────────

  async transferFunds(
    businessId: string,
    userId: string,
    dto: AccountTransferDto,
  ) {
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException('Cannot transfer to the same account');
    }
    return this.dataSource.transaction(async (tx) => {
      const from = await tx.findOne(AccountEntity, {
        where: { id: dto.fromAccountId, businessId },
      });
      const to = await tx.findOne(AccountEntity, {
        where: { id: dto.toAccountId, businessId },
      });
      if (!from || !to) throw new NotFoundException('Account not found');
      if (Number(from.currentBalance) < Number(dto.amount)) {
        throw new BadRequestException('Insufficient balance in source account');
      }

      const fromNew = Number(from.currentBalance) - Number(dto.amount);
      const toNew = Number(to.currentBalance) + Number(dto.amount);

      await tx.decrement(
        AccountEntity,
        { id: from.id },
        'currentBalance',
        Number(dto.amount),
      );
      await tx.increment(
        AccountEntity,
        { id: to.id },
        'currentBalance',
        Number(dto.amount),
      );

      const date = new Date(dto.transactionDate);
      await tx.save(AccountLedgerEntity, {
        businessId,
        accountId: from.id,
        transactionDate: date,
        transactionType: LedgerTransactionType.TRANSFER_OUT,
        referenceType: 'transfer',
        referenceId: to.id,
        debit: 0,
        credit: dto.amount,
        balanceAfter: fromNew,
        note: dto.note,
        createdBy: userId,
      });
      return tx.save(AccountLedgerEntity, {
        businessId,
        accountId: to.id,
        transactionDate: date,
        transactionType: LedgerTransactionType.TRANSFER_IN,
        referenceType: 'transfer',
        referenceId: from.id,
        debit: dto.amount,
        credit: 0,
        balanceAfter: toNew,
        note: dto.note,
        createdBy: userId,
      });
    });
  }

  // ─── Transactions (unified list + delete) ────────────────────────────────

  async getTransactions(businessId: string, dto: GetTransactionsDto) {
    const {
      transactionType,
      category,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 20,
    } = dto;
    const qb = this.ledgerRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.account', 'account')
      .where('l.businessId = :businessId', { businessId });

    if (transactionType && transactionType !== 'all') {
      qb.andWhere('l.transactionType = :transactionType', { transactionType });
    }
    if (category) qb.andWhere('l.category = :category', { category });
    if (dateFrom) qb.andWhere('l.transactionDate >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('l.transactionDate <= :dateTo', { dateTo });
    if (search) {
      qb.andWhere('(l.note ILIKE :search OR l.category ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    qb.orderBy('l.transactionDate', 'ASC').addOrderBy('l.createdAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, totalItems] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: Number(page),
      },
    };
  }

  async deleteTransaction(businessId: string, id: string) {
    return this.dataSource.transaction(async (tx) => {
      const entry = await tx.findOne(AccountLedgerEntity, {
        where: { id, businessId },
      });
      if (!entry) throw new NotFoundException('Transaction not found');

      if (Number(entry.debit) > 0) {
        await tx.decrement(
          AccountEntity,
          { id: entry.accountId },
          'currentBalance',
          Number(entry.debit),
        );
      }
      if (Number(entry.credit) > 0) {
        await tx.increment(
          AccountEntity,
          { id: entry.accountId },
          'currentBalance',
          Number(entry.credit),
        );
      }

      await tx.remove(AccountLedgerEntity, entry);
      return { message: 'Transaction deleted' };
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

    qb.orderBy('l.transactionDate', 'ASC')
      .addOrderBy('l.createdAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, totalItems] = await qb.getManyAndCount();
    return {
      data,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: Number(page),
      },
    };
  }

  // ─── Summary ──────────────────────────────────────────────────────────────

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
      else if (acc.accountType === AccountType.MOBILE_BANKING)
        summary.totalMobileBanking += bal;
    }
    summary.totalAssets =
      summary.totalCash + summary.totalBank + summary.totalMobileBanking;

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

  // ─── Reports ──────────────────────────────────────────────────────────────

  async getProfitLoss(businessId: string, dto: GetReportDto) {
    const { dateFrom, dateTo } = dto;

    const buildFilter = (col: string, startIdx: number): [string, any[]] => {
      const conds: string[] = [];
      const params: any[] = [];
      let i = startIdx;
      if (dateFrom) {
        conds.push(`${col} >= $${i++}`);
        params.push(dateFrom);
      }
      if (dateTo) {
        conds.push(`${col} <= $${i++}`);
        params.push(dateTo);
      }
      return [conds.length ? ' AND ' + conds.join(' AND ') : '', params];
    };

    const [df1, dp1] = buildFilter('sale_date', 2);
    const [salesRow] = await this.dataSource.query(
      `SELECT COALESCE(SUM(grand_total), 0) as revenue FROM sales WHERE business_id = $1 AND status != 'cancelled'${df1}`,
      [businessId, ...dp1],
    );

    const [df2, dp2] = buildFilter('s.sale_date', 2);
    const [cogsRow] = await this.dataSource.query(
      `SELECT COALESCE(SUM(si.cost_price * si.quantity), 0) as cogs
       FROM sale_items si JOIN sales s ON si.sale_id = s.id
       WHERE s.business_id = $1 AND s.status != 'cancelled'${df2}`,
      [businessId, ...dp2],
    );

    const [df3, dp3] = buildFilter('transaction_date', 2);
    const expensesByCategory: any[] = await this.dataSource.query(
      `SELECT COALESCE(category, 'Other') as category, COALESCE(SUM(credit), 0) as total
       FROM account_ledgers WHERE business_id = $1 AND transaction_type = 'expense'${df3}
       GROUP BY category ORDER BY total DESC`,
      [businessId, ...dp3],
    );

    const [df4, dp4] = buildFilter('transaction_date', 2);
    const [incRow] = await this.dataSource.query(
      `SELECT COALESCE(SUM(debit), 0) as total FROM account_ledgers WHERE business_id = $1 AND transaction_type = 'income'${df4}`,
      [businessId, ...dp4],
    );

    const revenue = Number(salesRow?.revenue ?? 0);
    const cogs = Number(cogsRow?.cogs ?? 0);
    const grossProfit = revenue - cogs;
    const otherIncome = Number(incRow?.total ?? 0);
    const expenses = expensesByCategory.map((e) => ({
      category: e.category,
      amount: Number(e.total),
    }));
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = grossProfit + otherIncome - totalExpenses;

    return {
      revenue: { sales: revenue, net: revenue },
      cogs: { net: cogs },
      grossProfit,
      otherIncome,
      expenses,
      totalExpenses,
      netProfit,
      grossMargin:
        revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : '0',
      netMargin:
        revenue + otherIncome > 0
          ? ((netProfit / (revenue + otherIncome)) * 100).toFixed(1)
          : '0',
    };
  }

  async getBalanceSheet(businessId: string) {
    const accounts = await this.accountRepo.find({ where: { businessId } });

    const cash = accounts
      .filter((a) => a.accountType === AccountType.CASH)
      .reduce((s, a) => s + Number(a.currentBalance), 0);
    const bank = accounts
      .filter((a) => a.accountType === AccountType.BANK)
      .reduce((s, a) => s + Number(a.currentBalance), 0);
    const mobile = accounts
      .filter((a) => a.accountType === AccountType.MOBILE_BANKING)
      .reduce((s, a) => s + Number(a.currentBalance), 0);

    const [arRow] = await this.dataSource.query(
      `SELECT COALESCE(SUM(due_amount), 0) as total FROM sales WHERE business_id = $1 AND status != 'cancelled'`,
      [businessId],
    );
    const [apRow] = await this.dataSource.query(
      `SELECT COALESCE(SUM(due_amount), 0) as total FROM purchases WHERE business_id = $1 AND status != 'cancelled'`,
      [businessId],
    );

    const receivable = Number(arRow?.total ?? 0);
    const payable = Number(apRow?.total ?? 0);

    const totalCurrentAssets = cash + bank + mobile + receivable;
    const totalAssets = totalCurrentAssets;
    const totalLiabilities = payable;
    const equity = totalAssets - totalLiabilities;

    return {
      assets: {
        current: [
          { name: 'Cash & Cash Equivalents', amount: cash },
          { name: 'Bank Accounts', amount: bank },
          { name: 'Mobile Banking', amount: mobile },
          { name: 'Accounts Receivable', amount: receivable },
        ],
        totalCurrent: totalCurrentAssets,
        totalAssets,
      },
      liabilities: {
        current: [{ name: 'Accounts Payable', amount: payable }],
        totalCurrent: payable,
        totalLiabilities,
      },
      equity: { amount: equity },
      totalCheck: totalAssets,
    };
  }

  async getTrialBalance(businessId: string) {
    const rows: any[] = await this.dataSource.query(
      `SELECT a.name, a.account_type as "accountType",
              COALESCE(SUM(l.debit), 0) as "totalDebit",
              COALESCE(SUM(l.credit), 0) as "totalCredit",
              a.current_balance as "currentBalance"
       FROM accounts a
       LEFT JOIN account_ledgers l ON l.account_id = a.id AND l.business_id = a.business_id
       WHERE a.business_id = $1
       GROUP BY a.id, a.name, a.account_type, a.current_balance
       ORDER BY a.account_type, a.name`,
      [businessId],
    );

    const totalDebit = rows.reduce((s, r) => s + Number(r.totalDebit), 0);
    const totalCredit = rows.reduce((s, r) => s + Number(r.totalCredit), 0);

    return {
      accounts: rows.map((r) => ({
        name: r.name,
        accountType: r.accountType,
        totalDebit: Number(r.totalDebit),
        totalCredit: Number(r.totalCredit),
        balance: Number(r.currentBalance),
      })),
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }

  async getCashFlow(businessId: string, dto: GetReportDto) {
    const { dateFrom, dateTo } = dto;

    const buildFilter = (startIdx: number): [string, any[]] => {
      const conds: string[] = [];
      const params: any[] = [];
      let i = startIdx;
      if (dateFrom) {
        conds.push(`transaction_date >= $${i++}`);
        params.push(dateFrom);
      }
      if (dateTo) {
        conds.push(`transaction_date <= $${i++}`);
        params.push(dateTo);
      }
      return [conds.length ? ' AND ' + conds.join(' AND ') : '', params];
    };

    const [df, dp] = buildFilter(2);

    const [saleIn] = await this.dataSource.query(
      `SELECT COALESCE(SUM(debit), 0) as total FROM account_ledgers WHERE business_id = $1 AND transaction_type = 'sale_payment'${df}`,
      [businessId, ...dp],
    );
    const [incIn] = await this.dataSource.query(
      `SELECT COALESCE(SUM(debit), 0) as total FROM account_ledgers WHERE business_id = $1 AND transaction_type = 'income'${df}`,
      [businessId, ...dp],
    );
    const [purOut] = await this.dataSource.query(
      `SELECT COALESCE(SUM(credit), 0) as total FROM account_ledgers WHERE business_id = $1 AND transaction_type = 'purchase_payment'${df}`,
      [businessId, ...dp],
    );
    const [expOut] = await this.dataSource.query(
      `SELECT COALESCE(SUM(credit), 0) as total FROM account_ledgers WHERE business_id = $1 AND transaction_type = 'expense'${df}`,
      [businessId, ...dp],
    );

    const cashFromSales = Number(saleIn?.total ?? 0);
    const cashFromIncome = Number(incIn?.total ?? 0);
    const cashPaidSuppliers = Number(purOut?.total ?? 0);
    const cashPaidExpenses = Number(expOut?.total ?? 0);
    const operatingTotal =
      cashFromSales + cashFromIncome - cashPaidSuppliers - cashPaidExpenses;

    const [openRow] = await this.dataSource.query(
      `SELECT COALESCE(SUM(debit), 0) as total FROM account_ledgers WHERE business_id = $1 AND transaction_type = 'opening'`,
      [businessId],
    );
    const openingBalance = Number(openRow?.total ?? 0);

    return {
      operating: [
        { label: 'Cash received from customers', amount: cashFromSales },
        { label: 'Other income received', amount: cashFromIncome },
        { label: 'Cash paid to suppliers', amount: -cashPaidSuppliers },
        { label: 'Cash paid for expenses', amount: -cashPaidExpenses },
      ],
      operatingTotal,
      openingBalance,
      closingBalance: openingBalance + operatingTotal,
      netCashFlow: operatingTotal,
    };
  }
}
