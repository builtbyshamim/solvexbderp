import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseEntity } from './entities/warehouse.entity';
import { StockLocationEntity } from './entities/stock-location.entity';
import { WarehouseService } from './services/warehouse.service';
import { StockLocationService } from './services/stock-location.service';
import { WarehouseController } from './controllers/warehouse.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WarehouseEntity, StockLocationEntity])],
  controllers: [WarehouseController],
  providers: [WarehouseService, StockLocationService],
  exports: [WarehouseService, StockLocationService, TypeOrmModule],
})
export class WarehouseModule {}
