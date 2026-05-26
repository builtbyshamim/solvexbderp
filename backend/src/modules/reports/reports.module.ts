import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleEntity } from 'src/modules/sales/entities/sale.entity';
import { PurchaseEntity } from 'src/modules/purchase/entities/purchase.entity';
import { ProductStockEntity } from 'src/modules/inventory/product/entities/product-stock.entity';
import { CustomerEntity } from 'src/modules/sales/entities/customer.entity';
import { SupplierEntity } from 'src/modules/purchase/entities/supplier.entity';
import { ReportsService } from './services/reports.service';
import { ReportsController } from './controllers/reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SaleEntity, PurchaseEntity, ProductStockEntity, CustomerEntity, SupplierEntity]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
