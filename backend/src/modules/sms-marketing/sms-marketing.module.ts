import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsTemplateEntity } from './entities/sms-template.entity';
import { SmsCampaignEntity } from './entities/sms-campaign.entity';
import { SmsLogEntity } from './entities/sms-log.entity';
import { SmsGroupEntity, SmsGroupMemberEntity } from './entities/sms-group.entity';
import { SmsConfigEntity } from './entities/sms-config.entity';
import { SmsPackageEntity, SmsCreditEntity } from './entities/sms-package.entity';
import { DueReminderEntity, DueReminderLogEntity } from './entities/due-reminder.entity';
import { TransactionalSmsSettingEntity } from './entities/transactional-sms.entity';
import { SmsMarketingService } from './services/sms-marketing.service';
import { SmsMarketingController } from './controllers/sms-marketing.controller';
import { CustomerEntity } from '../sales/entities/customer.entity';
import { BusinessEntity } from '../business/entities/business.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SmsTemplateEntity,
      SmsCampaignEntity,
      SmsLogEntity,
      SmsGroupEntity,
      SmsGroupMemberEntity,
      SmsConfigEntity,
      SmsPackageEntity,
      SmsCreditEntity,
      DueReminderEntity,
      DueReminderLogEntity,
      CustomerEntity,
      BusinessEntity,
      TransactionalSmsSettingEntity,
    ]),
  ],
  controllers: [SmsMarketingController],
  providers: [SmsMarketingService],
  exports: [SmsMarketingService],
})
export class SmsMarketingModule {}
