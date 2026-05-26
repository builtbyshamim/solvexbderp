import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarrantyEntity } from './entities/warranty.entity';
import { WarrantyService } from './services/warranty.service';
import { WarrantyController } from './controllers/warranty.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WarrantyEntity])],
  controllers: [WarrantyController],
  providers: [WarrantyService],
  exports: [WarrantyService],
})
export class WarrantyModule {}
