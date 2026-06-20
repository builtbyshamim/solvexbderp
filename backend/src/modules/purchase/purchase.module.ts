import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierEntity } from './entities/supplier.entity';
import { PurchaseEntity, PurchaseItemEntity } from './entities/purchase.entity';
import { SupplierLedgerAdjustmentEntity } from './entities/supplier-adjustment.entity';
import { PurchaseService } from './services/purchase.service';
import { PurchaseController } from './controllers/purchase.controller';
import { ProductModule } from '../inventory/product/product.module';
import { AccountEntity } from '../accounting/entities/account.entity';
import { AccountLedgerEntity } from '../accounting/entities/account-ledger.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupplierEntity, PurchaseEntity, PurchaseItemEntity,
      SupplierLedgerAdjustmentEntity, AccountEntity, AccountLedgerEntity,
    ]),
    ProductModule,
  ],
  controllers: [PurchaseController],
  providers: [PurchaseService],
  exports: [PurchaseService],
})
export class PurchaseModule {}
