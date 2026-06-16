import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './entities/product.entity';
import { ProductStockEntity } from './entities/product-stock.entity';
import { StockLedgerEntity } from './entities/stock-ledger.entity';
import { ProductService } from './services/product.service';
import { ProductImportExportService } from './services/product-import-export.service';
import { ProductController } from './controllers/product.controller';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { CategoryEntity } from '../category/entities/category.entity';
import { UnitEntity } from '../unit/entities/unit.entity';
import { BrandEntity } from '../brand/entities/brand.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      ProductStockEntity,
      StockLedgerEntity,
      CategoryEntity,
      UnitEntity,
      BrandEntity,
    ]),
    WarehouseModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, ProductImportExportService],
  exports: [ProductService, TypeOrmModule, WarehouseModule],
})
export class ProductModule {}
