import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BusinessService } from '../services/business.service';
import { SetupBusinessDto } from '../dto/setup-business.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserEntity } from 'src/modules/users/entities/user.entity';

@ApiTags('Business')
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
}
