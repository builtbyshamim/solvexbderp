import {
  Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AffiliateService } from '../services/affiliate.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/shared/enums/user-role.enum';
import {
  ApplyAffiliateDto,
  UpdateAffiliateStatusDto,
  UpdateCommissionRateDto,
  RecordCommissionDto,
  GenerateMonthlyCommissionsDto,
  UpdateCommissionStatusDto,
  CreatePayoutDto,
  AffiliateQueryDto,
  CommissionQueryDto,
} from '../dto/affiliate.dto';

@ApiTags('Affiliate')
@ApiBearerAuth()
@Controller({ path: 'affiliate', version: '1' })
export class AffiliateController {
  constructor(private readonly svc: AffiliateService) {}

  // ─── User routes ─────────────────────────────────────────────────────────────

  @Post('apply')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Apply to become an affiliate' })
  apply(@CurrentUser() user: any, @Body() dto: ApplyAffiliateDto) {
    return this.svc.apply(user.id, dto);
  }

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get my affiliate profile & stats' })
  getMe(@CurrentUser() user: any) {
    return this.svc.getMyAffiliate(user.id);
  }

  @Get('me/referrals')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get my referrals' })
  getMyReferrals(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.svc.getMyReferrals(user.id, +page, +limit);
  }

  @Get('me/commissions')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get my commission history' })
  getMyCommissions(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.svc.getMyCommissions(user.id, +page, +limit);
  }

  // ─── Admin/SuperAdmin routes ─────────────────────────────────────────────────

  @Get('admin/stats')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Platform-wide affiliate stats' })
  getStats() {
    return this.svc.getStats();
  }

  @Get('admin')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all affiliates' })
  findAll(@Query() query: AffiliateQueryDto) {
    return this.svc.findAll(query);
  }

  @Get('admin/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get affiliate detail' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id);
  }

  @Patch('admin/:id/status')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve / reject / activate / deactivate affiliate' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAffiliateStatusDto,
  ) {
    return this.svc.updateStatus(id, dto);
  }

  @Patch('admin/:id/commission-rate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update commission rate for an affiliate' })
  updateRate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommissionRateDto,
  ) {
    return this.svc.updateCommissionRate(id, dto);
  }

  @Post('admin/:id/sync-referrals')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Sync referrals from user registrations' })
  syncReferrals(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.syncReferrals(id);
  }

  @Post('admin/commissions/record')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Record a commission manually' })
  recordCommission(@Body() dto: RecordCommissionDto, @CurrentUser() user: any) {
    return this.svc.recordCommission(dto, user.id);
  }

  @Post('admin/commissions/generate-monthly')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Generate commissions for all active referrals for a month' })
  generateMonthly(@Body() dto: GenerateMonthlyCommissionsDto, @CurrentUser() user: any) {
    return this.svc.generateMonthlyCommissions(dto, user.id);
  }

  @Get('admin/commissions')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all commissions' })
  findCommissions(@Query() query: CommissionQueryDto) {
    return this.svc.findCommissions(query);
  }

  @Patch('admin/commissions/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve / cancel / mark paid a commission' })
  updateCommissionStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommissionStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.svc.updateCommissionStatus(id, dto, user.id);
  }

  @Post('admin/payouts')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a payout to an affiliate' })
  createPayout(@Body() dto: CreatePayoutDto, @CurrentUser() user: any) {
    return this.svc.createPayout(dto, user.id);
  }

  @Get('admin/payouts')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all payouts' })
  findPayouts(
    @Query('affiliateId') affiliateId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.svc.findPayouts(affiliateId, +page, +limit);
  }
}
