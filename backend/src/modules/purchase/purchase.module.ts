import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierEntity } from './entities/supplier.entity';
import { PurchaseEntity, PurchaseItemEntity } from './entities/purchase.entity';
import { PurchaseService } from './services/purchase.service';
import { PurchaseController } from './controllers/purchase.controller';
import { ProductModule } from '../inventory/product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupplierEntity, PurchaseEntity, PurchaseItemEntity]),
    ProductModule,
  ],
  controllers: [PurchaseController],
  providers: [PurchaseService],
  exports: [PurchaseService],
})
export class PurchaseModule {}
