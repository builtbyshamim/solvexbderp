import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './services/users.service';
import { AuthModule } from '../auth/auth.module';
import { RefreshTokenEntity } from '../auth/entities/refresh-token.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
    forwardRef(() => AuthModule),
    MailModule
  ],
  exports: [UsersService, TypeOrmModule],
})
export class UserModule {}
