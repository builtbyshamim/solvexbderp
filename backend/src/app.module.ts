import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import appConfig from './config/app.config';
import { CacheModule } from '@nestjs/cache-manager';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import jwtConfig from './config/jwt.config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionGuard } from './common/guards/permission.guard';
import { SubscriptionGuard } from './common/guards/subscription.guard';
import { UserModule } from './modules/users/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './modules/mail/mail.module';
import { ImageUploadModule } from './modules/image-upload/image-upload.module';
import mailConfig from './config/mail.config';
import { BusinessModule } from './modules/business/business.module';
import { CategoryModule } from './modules/inventory/category/category.module';
import { UnitModule } from './modules/inventory/unit/unit.module';
import { BrandModule } from './modules/inventory/brand/brand.module';
import { WarrantyModule } from './modules/inventory/warranty/warranty.module';
import { WarehouseModule } from './modules/inventory/warehouse/warehouse.module';
import { ProductModule } from './modules/inventory/product/product.module';
import { StockModule } from './modules/inventory/stock/stock.module';
import { PurchaseModule } from './modules/purchase/purchase.module';
import { SalesModule } from './modules/sales/sales.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { HrmModule } from './modules/hrm/hrm.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SmsMarketingModule } from './modules/sms-marketing/sms-marketing.module';
import { AffiliateModule } from './modules/affiliate/affiliate.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig, jwtConfig, mailConfig],
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env' : '.env.development',
    }),
    // ✅ CACHE (Keyv + node-redis internally)
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl =
          configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

        return {
          store: new Keyv({
            store: new KeyvRedis(redisUrl, {
              namespace: 'bizcore:',
            }),
            ttl: 600_000, // 10 minutes
          }),
        };
      },
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.user'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        autoLoadEntities: configService.get<boolean>(
          'database.autoLoadEntities',
        ),
        synchronize: configService.get<boolean>('database.synchronize'),
        ssl: configService.get('database.ssl'),
      }),
    }),
    AuthModule,
    UserModule,
    MailModule,
    ImageUploadModule,
    BusinessModule,
    CategoryModule,
    UnitModule,
    BrandModule,
    WarrantyModule,
    WarehouseModule,
    ProductModule,
    StockModule,
    PurchaseModule,
    SalesModule,
    AccountingModule,
    HrmModule,
    ReportsModule,
    SmsMarketingModule,
    AffiliateModule,
    SuperAdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },

    // ✅ Global Roles Guard
    { provide: APP_GUARD, useClass: RolesGuard },

    // ✅ Global Permission Guard (fine-grained, checked after RolesGuard)
    { provide: APP_GUARD, useClass: PermissionGuard },

    // ✅ Subscription Guard — blocks all API calls for expired subscriptions
    { provide: APP_GUARD, useClass: SubscriptionGuard },
  ],
})
export class AppModule {}
