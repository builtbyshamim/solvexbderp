import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountingService } from '../services/accounting.service';
import {
  AccountTransferDto, CreateAccountDto, CreateExpenseDto, CreateIncomeDto,
  GetAccountsDto, GetLedgerDto, UpdateAccountDto,
} from '../dto/accounting.dto';
import { BusinessId } from 'src/common/decorators/business-id.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserEntity } from 'src/modules/users/entities/user.entity';

@ApiTags('Accounting')
@Controller({ path: 'accounting', version: '1' })
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // ── Accounts ──
  @Post('accounts')
  @ApiOperation({ summary: 'Create account (cash/bank/mobile banking)' })
  createAccount(@BusinessId() biz: string, @Body() dto: CreateAccountDto) {
    return this.accountingService.createAccount(biz, dto);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Get all accounts' })
  getAccounts(@BusinessId() biz: string, @Query() q: GetAccountsDto) {
    return this.accountingService.findAllAccounts(biz, q);
  }

  @Get('accounts/summary')
  @ApiOperation({ summary: 'Get financial summary (totals per type)' })
  getSummary(@BusinessId() biz: string) {
    return this.accountingService.getSummary(biz);
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

  // ── Transactions ──
  @Post('income')
  @ApiOperation({ summary: 'Record income' })
  recordIncome(
    @BusinessId() biz: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateIncomeDto,
  ) {
    return this.accountingService.recordIncome(biz, user.id, dto);
  }

  @Post('expense')
  @ApiOperation({ summary: 'Record expense' })
  recordExpense(
    @BusinessId() biz: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.accountingService.recordExpense(biz, user.id, dto);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer funds between accounts' })
  transfer(
    @BusinessId() biz: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: AccountTransferDto,
  ) {
    return this.accountingService.transferFunds(biz, user.id, dto);
  }

  // ── Ledger ──
  @Get('ledger')
  @ApiOperation({ summary: 'Get account ledger with filters' })
  getLedger(@BusinessId() biz: string, @Query() q: GetLedgerDto) {
    return this.accountingService.getLedger(biz, q);
  }
}
