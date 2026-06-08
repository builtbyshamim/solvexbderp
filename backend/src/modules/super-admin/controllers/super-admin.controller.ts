import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SuperAdminService } from '../services/super-admin.service';
import {
  GetBusinessesDto,
  ResetBusinessDto,
  SubscriptionActionDto,
  ToggleStatusDto,
} from '../dto/super-admin.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/shared/enums/user-role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserEntity } from 'src/modules/users/entities/user.entity';

@ApiTags('Super Admin')
@Controller({ path: 'super-admin', version: '1' })
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminController {
  constructor(private readonly service: SuperAdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Platform-wide dashboard stats' })
  getDashboard() {
    return this.service.getDashboard();
  }

  @Get('businesses')
  @ApiOperation({ summary: 'List all businesses with pagination and filters' })
  getAllBusinesses(@Query() dto: GetBusinessesDto) {
    return this.service.getAllBusinesses(dto);
  }

  @Get('businesses/:id')
  @ApiOperation({ summary: 'Get a single business detail' })
  getBusinessDetail(@Param('id') id: string) {
    return this.service.getBusinessDetail(id);
  }

  @Patch('businesses/:id/status')
  @ApiOperation({ summary: 'Suspend or activate a business' })
  toggleStatus(@Param('id') id: string, @Body() dto: ToggleStatusDto) {
    return this.service.toggleStatus(id, dto);
  }

  @Patch('businesses/:id/subscription')
  @ApiOperation({ summary: 'Subscription management actions (renew, change plan, etc.)' })
  updateSubscription(
    @Param('id') id: string,
    @Body() dto: SubscriptionActionDto,
    @CurrentUser() admin: UserEntity,
  ) {
    return this.service.updateSubscription(id, dto);
  }

  @Post('businesses/:id/reset')
  @ApiOperation({ summary: 'Reset all business operational data (destructive)' })
  resetBusinessData(
    @Param('id') id: string,
    @Body() dto: ResetBusinessDto,
    @CurrentUser() admin: UserEntity,
  ) {
    return this.service.resetBusinessData(id, dto, admin.id);
  }
}
