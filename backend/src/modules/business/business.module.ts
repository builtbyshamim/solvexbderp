import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessEntity } from './entities/business.entity';
import { BusinessService } from './services/business.service';
import { BusinessController } from './controllers/business.controller';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { PackageEntity } from '../packages/entities/package.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessEntity, UserEntity, PackageEntity]),
    AuthModule,
  ],
  controllers: [BusinessController],
  providers: [BusinessService],
  exports: [BusinessService],
})
export class BusinessModule {}
