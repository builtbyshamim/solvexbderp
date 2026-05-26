import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity } from './entities/customer.entity';
import { SaleEntity, SaleItemEntity } from './entities/sale.entity';
import { SalesService } from './services/sales.service';
import { SalesController } from './controllers/sales.controller';
import { ProductModule } from '../inventory/product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerEntity, SaleEntity, SaleItemEntity]),
    ProductModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
