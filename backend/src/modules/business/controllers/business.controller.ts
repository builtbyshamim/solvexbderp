import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { BusinessService } from '../services/business.service';
import { SetupBusinessDto } from '../dto/setup-business.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

class SubscribeDto {
  @ApiProperty() @IsString() packageId: string;
  @ApiProperty({ enum: ['monthly', 'yearly'] }) @IsIn(['monthly', 'yearly']) billingCycle: 'monthly' | 'yearly';
}

class RenewDto {
  @ApiProperty({ enum: ['monthly', 'yearly'] }) @IsIn(['monthly', 'yearly']) billingCycle: 'monthly' | 'yearly';
}

@ApiTags('Business')
@ApiBearerAuth()
@Controller({ path: 'business', version: '1' })
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post('setup')
  @ApiOperation({ summary: 'Initial business setup after registration' })
  setup(@CurrentUser() user: UserEntity, @Body() dto: SetupBusinessDto) {
    return this.businessService.setup(user, dto);
  }

  @Get('me')
  @ApiOperation({ summary: "Get current user's business profile" })
  getMyBusiness(@CurrentUser() user: UserEntity) {
    return this.businessService.findByOwner(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update business profile' })
  updateMyBusiness(
    @CurrentUser() user: UserEntity,
    @Body() dto: Partial<SetupBusinessDto>,
  ) {
    return this.businessService.update(user.id, dto);
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to a package plan' })
  subscribe(@CurrentUser() user: UserEntity, @Body() dto: SubscribeDto) {
    return this.businessService.subscribeToPackage(user.id, dto.packageId, dto.billingCycle);
  }

  @Post('subscription/renew')
  @ApiOperation({ summary: 'Renew current subscription' })
  renew(@CurrentUser() user: UserEntity, @Body() dto: RenewDto) {
    return this.businessService.renewSubscription(user.id, dto.billingCycle);
  }
}
