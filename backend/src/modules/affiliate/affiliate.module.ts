import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateEntity } from './entities/affiliate.entity';
import { AffiliateReferralEntity } from './entities/affiliate-referral.entity';
import { AffiliateCommissionEntity } from './entities/affiliate-commission.entity';
import { AffiliatePayoutEntity } from './entities/affiliate-payout.entity';
import { AffiliateService } from './services/affiliate.service';
import { AffiliateController } from './controllers/affiliate.controller';
import { UserEntity } from 'src/modules/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AffiliateEntity,
      AffiliateReferralEntity,
      AffiliateCommissionEntity,
      AffiliatePayoutEntity,
      UserEntity,
    ]),
  ],
  controllers: [AffiliateController],
  providers: [AffiliateService],
  exports: [AffiliateService],
})
export class AffiliateModule {}
