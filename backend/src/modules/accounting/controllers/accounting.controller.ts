import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountingService } from '../services/accounting.service';
import {
  AccountTransferDto, CreateAccountDto, CreateExpenseDto, CreateIncomeDto,
  GetAccountsDto, GetLedgerDto, GetReportDto, GetTransactionsDto, UpdateAccountDto,
  CreateAccountingCategoryDto, UpdateAccountingCategoryDto, GetAccountingCategoriesDto,
} from '../dto/accounting.dto';
import { BusinessId } from 'src/common/decorators/business-id.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserEntity } from 'src/modules/users/entities/user.entity';

@ApiTags('Accounting')
@Controller({ path: 'accounting', version: '1' })
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // ── Categories ────────────────────────────────────────────────────────────

  @Post('categories')
  @ApiOperation({ summary: 'Create income/expense category' })
  createCategory(@BusinessId() biz: string, @Body() dto: CreateAccountingCategoryDto) {
    return this.accountingService.createCategory(biz, dto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get categories (filter by type: income | expense | both)' })
  getCategories(@BusinessId() biz: string, @Query() q: GetAccountingCategoriesDto) {
    return this.accountingService.getCategories(biz, q);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update category' })
  updateCategory(@BusinessId() biz: string, @Param('id') id: string, @Body() dto: UpdateAccountingCategoryDto) {
    return this.accountingService.updateCategory(biz, id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete category' })
  deleteCategory(@BusinessId() biz: string, @Param('id') id: string) {
    return this.accountingService.deleteCategory(biz, id);
  }

  // ── Accounts ──────────────────────────────────────────────────────────────

  @Post('accounts')
  @ApiOperation({ summary: 'Create account (cash/bank/mobile banking)' })
  createAccount(@BusinessId() biz: string, @Body() dto: CreateAccountDto) {
    return this.accountingService.createAccount(biz, dto);
  }

  @Get('accounts/summary')
  @ApiOperation({ summary: 'Get financial summary (totals per type)' })
  getSummary(@BusinessId() biz: string) {
    return this.accountingService.getSummary(biz);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Get all accounts' })
  getAccounts(@BusinessId() biz: string, @Query() q: GetAccountsDto) {
    return this.accountingService.findAllAccounts(biz, q);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get account by ID' })
  getAccount(@BusinessId() biz: string, @Param('id') id: string) {
    return this.accountingService.findAccount(biz, id);
  }

  @Patch('accounts/:id')
  @ApiOperation({ summary: 'Update account' })
  updateAccount(@BusinessId() biz: string, @Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accountingService.updateAccount(biz, id, dto);
  }

  @Delete('accounts/:id')
  @ApiOperation({ summary: 'Delete account (only if no ledger entries)' })
  deleteAccount(@BusinessId() biz: string, @Param('id') id: string) {
    return this.accountingService.deleteAccount(biz, id);
  }

  // ── Income ────────────────────────────────────────────────────────────────

  @Post('income')
  @ApiOperation({ summary: 'Record income' })
  recordIncome(
    @BusinessId() biz: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateIncomeDto,
  ) {
    return this.accountingService.recordIncome(biz, user.id, dto);
  }

  @Get('income')
  @ApiOperation({ summary: 'List income transactions' })
  getIncomes(@BusinessId() biz: string, @Query() q: GetTransactionsDto) {
    return this.accountingService.getIncomes(biz, q);
  }

  // ── Expense ───────────────────────────────────────────────────────────────

  @Post('expense')
  @ApiOperation({ summary: 'Record expense' })
  recordExpense(
    @BusinessId() biz: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.accountingService.recordExpense(biz, user.id, dto);
  }

  @Get('expense')
  @ApiOperation({ summary: 'List expense transactions' })
  getExpenses(@BusinessId() biz: string, @Query() q: GetTransactionsDto) {
    return this.accountingService.getExpenses(biz, q);
  }

  // ── Transfer ──────────────────────────────────────────────────────────────

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer funds between accounts' })
  transfer(
    @BusinessId() biz: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: AccountTransferDto,
  ) {
    return this.accountingService.transferFunds(biz, user.id, dto);
  }

  // ── Transactions (unified) ────────────────────────────────────────────────

  @Get('transactions')
  @ApiOperation({ summary: 'Get all transactions with filters' })
  getTransactions(@BusinessId() biz: string, @Query() q: GetTransactionsDto) {
    return this.accountingService.getTransactions(biz, q);
  }

  @Delete('transactions/:id')
  @ApiOperation({ summary: 'Delete a transaction and reverse its balance effect' })
  deleteTransaction(@BusinessId() biz: string, @Param('id') id: string) {
    return this.accountingService.deleteTransaction(biz, id);
  }

  // ── Ledger ────────────────────────────────────────────────────────────────

  @Get('ledger')
  @ApiOperation({ summary: 'Get account ledger with filters' })
  getLedger(@BusinessId() biz: string, @Query() q: GetLedgerDto) {
    return this.accountingService.getLedger(biz, q);
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  @Get('reports/profit-loss')
  @ApiOperation({ summary: 'Profit & Loss statement' })
  getProfitLoss(@BusinessId() biz: string, @Query() q: GetReportDto) {
    return this.accountingService.getProfitLoss(biz, q);
  }

  @Get('reports/balance-sheet')
  @ApiOperation({ summary: 'Balance sheet' })
  getBalanceSheet(@BusinessId() biz: string) {
    return this.accountingService.getBalanceSheet(biz);
  }

  @Get('reports/trial-balance')
  @ApiOperation({ summary: 'Trial balance' })
  getTrialBalance(@BusinessId() biz: string) {
    return this.accountingService.getTrialBalance(biz);
  }

  @Get('reports/cash-flow')
  @ApiOperation({ summary: 'Cash flow statement' })
  getCashFlow(@BusinessId() biz: string, @Query() q: GetReportDto) {
    return this.accountingService.getCashFlow(biz, q);
  }
}
