import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockAdjustmentEntity } from './entities/stock-adjustment.entity';
import { StockTransferEntity } from './entities/stock-transfer.entity';
import { StockService } from './services/stock.service';
import { StockController } from './controllers/stock.controller';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockAdjustmentEntity, StockTransferEntity]),
    ProductModule,
  ],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
