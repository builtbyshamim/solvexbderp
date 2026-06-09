import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity } from './entities/customer.entity';
import { SaleEntity, SaleItemEntity } from './entities/sale.entity';
import { QuotationEntity, QuotationItemEntity } from './entities/quotation.entity';
import { SaleReturnEntity, SaleReturnItemEntity } from './entities/sale-return.entity';
import { CustomerLedgerAdjustmentEntity } from './entities/customer-adjustment.entity';
import { SalesService } from './services/sales.service';
import { CustomerImportExportService } from './services/customer-import-export.service';
import { SalesController } from './controllers/sales.controller';
import { ProductModule } from '../inventory/product/product.module';
import { SmsMarketingModule } from '../sms-marketing/sms-marketing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerEntity, SaleEntity, SaleItemEntity,
      QuotationEntity, QuotationItemEntity,
      SaleReturnEntity, SaleReturnItemEntity,
      CustomerLedgerAdjustmentEntity,
    ]),
    ProductModule,
    SmsMarketingModule,
  ],
  controllers: [SalesController],
  providers: [SalesService, CustomerImportExportService],
  exports: [SalesService],
})
export class SalesModule {}
