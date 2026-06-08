import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from './entities/account.entity';
import { AccountLedgerEntity } from './entities/account-ledger.entity';
import { AccountingCategoryEntity } from './entities/accounting-category.entity';
import { AccountingService } from './services/accounting.service';
import { AccountingController } from './controllers/accounting.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity, AccountLedgerEntity, AccountingCategoryEntity])],
  controllers: [AccountingController],
  providers: [AccountingService],
  exports: [AccountingService],
})
export class AccountingModule {}
