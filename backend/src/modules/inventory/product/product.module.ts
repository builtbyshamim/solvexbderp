import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './entities/product.entity';
import { ProductStockEntity } from './entities/product-stock.entity';
import { StockLedgerEntity } from './entities/stock-ledger.entity';
import { ProductService } from './services/product.service';
import { ProductController } from './controllers/product.controller';
import { WarehouseModule } from '../warehouse/warehouse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, ProductStockEntity, StockLedgerEntity]),
    WarehouseModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService, TypeOrmModule, WarehouseModule],
})
export class ProductModule {}
