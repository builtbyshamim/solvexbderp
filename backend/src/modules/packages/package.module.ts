import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackageEntity } from './entities/package.entity';
import { PackageService } from './services/package.service';
import { PackageController } from './controllers/package.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PackageEntity])],
  controllers: [PackageController],
  providers: [PackageService],
  exports: [PackageService],
})
export class PackageModule {}
