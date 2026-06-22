import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentRequestEntity } from './entities/payment-request.entity';
import { BusinessEntity } from 'src/modules/business/entities/business.entity';
import { PackageEntity } from 'src/modules/packages/entities/package.entity';
import { BillingController } from './controllers/billing.controller';
import { BillingService } from './services/billing.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentRequestEntity, BusinessEntity, PackageEntity]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
