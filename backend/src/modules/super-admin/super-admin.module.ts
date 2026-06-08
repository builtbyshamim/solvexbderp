import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessEntity } from 'src/modules/business/entities/business.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { SuperAdminController } from './controllers/super-admin.controller';
import { SuperAdminService } from './services/super-admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessEntity, UserEntity])],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
})
export class SuperAdminModule {}
