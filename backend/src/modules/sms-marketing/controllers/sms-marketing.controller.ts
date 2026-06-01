import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SmsMarketingService } from '../services/sms-marketing.service';
import {
  CreateSmsTemplateDto, UpdateSmsTemplateDto, GetSmsTemplatesDto,
  CreateSmsCampaignDto, UpdateSmsCampaignDto, GetSmsCampaignsDto,
  QuickSendSmsDto, GetSmsLogsDto,
  CreateSmsGroupDto, UpdateSmsGroupDto, GetSmsGroupsDto, GetGroupMembersDto, AddGroupMembersDto,
  SaveSmsConfigDto, TestSmsDto,
  PurchasePackageDto,
  CreateDueReminderDto, UpdateDueReminderDto, GetDueReminderLogsDto,
} from '../dto/sms-marketing.dto';
import { BusinessId } from 'src/common/decorators/business-id.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserEntity } from 'src/modules/users/entities/user.entity';

@ApiTags('SMS Marketing')
@Controller({ path: 'sms-marketing', version: '1' })
export class SmsMarketingController {
  constructor(private readonly smsService: SmsMarketingService) {}

  // ── Stats ────────────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard stats' })
  getStats(@BusinessId() biz: string) {
    return this.smsService.getStats(biz);
  }

  // ── Templates ────────────────────────────────────────────────────────────

  @Post('templates')
  @ApiOperation({ summary: 'Create template' })
  createTemplate(@BusinessId() biz: string, @Body() dto: CreateSmsTemplateDto) {
    return this.smsService.createTemplate(biz, dto);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all templates' })
  getTemplates(@BusinessId() biz: string, @Query() q: GetSmsTemplatesDto) {
    return this.smsService.findAllTemplates(biz, q);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get template by ID' })
  getTemplate(@BusinessId() biz: string, @Param('id') id: string) {
    return this.smsService.findTemplate(biz, id);
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: 'Update template' })
  updateTemplate(@BusinessId() biz: string, @Param('id') id: string, @Body() dto: UpdateSmsTemplateDto) {
    return this.smsService.updateTemplate(biz, id, dto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete template' })
  deleteTemplate(@BusinessId() biz: string, @Param('id') id: string) {
    return this.smsService.deleteTemplate(biz, id);
  }

  // ── Groups ───────────────────────────────────────────────────────────────

  @Post('groups')
  @ApiOperation({ summary: 'Create group' })
  createGroup(@BusinessId() biz: string, @Body() dto: CreateSmsGroupDto) {
    return this.smsService.createGroup(biz, dto);
  }

  @Get('groups')
  @ApiOperation({ summary: 'Get all groups' })
  getGroups(@BusinessId() biz: string, @Query() q: GetSmsGroupsDto) {
    return this.smsService.findAllGroups(biz, q);
  }

  @Get('groups/:id')
  @ApiOperation({ summary: 'Get group by ID' })
  getGroup(@BusinessId() biz: string, @Param('id') id: string) {
    return this.smsService.findGroup(biz, id);
  }

  @Patch('groups/:id')
  @ApiOperation({ summary: 'Update group' })
  updateGroup(@BusinessId() biz: string, @Param('id') id: string, @Body() dto: UpdateSmsGroupDto) {
    return this.smsService.updateGroup(biz, id, dto);
  }

  @Delete('groups/:id')
  @ApiOperation({ summary: 'Delete group' })
  deleteGroup(@BusinessId() biz: string, @Param('id') id: string) {
    return this.smsService.deleteGroup(biz, id);
  }

  @Get('groups/:id/members')
  @ApiOperation({ summary: 'Get group members' })
  getGroupMembers(@BusinessId() biz: string, @Param('id') id: string, @Query() q: GetGroupMembersDto) {
    return this.smsService.getGroupMembers(biz, id, q);
  }

  @Post('groups/:id/members')
  @ApiOperation({ summary: 'Add members to group' })
  addGroupMembers(@BusinessId() biz: string, @Param('id') id: string, @Body() dto: AddGroupMembersDto) {
    return this.smsService.addGroupMembers(biz, id, dto);
  }

  @Delete('groups/:id/members/:memberId')
  @ApiOperation({ summary: 'Remove member from group' })
  removeGroupMember(@BusinessId() biz: string, @Param('id') id: string, @Param('memberId') memberId: string) {
    return this.smsService.removeGroupMember(biz, id, memberId);
  }

  @Post('groups/:id/import-customers')
  @ApiOperation({ summary: 'Import all customers into group' })
  importCustomers(@BusinessId() biz: string, @Param('id') id: string) {
    return this.smsService.importCustomersToGroup(biz, id);
  }

  // ── Campaigns ────────────────────────────────────────────────────────────

  @Post('campaigns')
  @ApiOperation({ summary: 'Create campaign' })
  createCampaign(@BusinessId() biz: string, @CurrentUser() user: UserEntity, @Body() dto: CreateSmsCampaignDto) {
    return this.smsService.createCampaign(biz, user.id, dto);
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'Get all campaigns' })
  getCampaigns(@BusinessId() biz: string, @Query() q: GetSmsCampaignsDto) {
    return this.smsService.findAllCampaigns(biz, q);
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  getCampaign(@BusinessId() biz: string, @Param('id') id: string) {
    return this.smsService.findCampaign(biz, id);
  }

  @Patch('campaigns/:id')
  @ApiOperation({ summary: 'Update campaign' })
  updateCampaign(@BusinessId() biz: string, @Param('id') id: string, @Body() dto: UpdateSmsCampaignDto) {
    return this.smsService.updateCampaign(biz, id, dto);
  }

  @Post('campaigns/:id/send')
  @ApiOperation({ summary: 'Send campaign' })
  sendCampaign(@BusinessId() biz: string, @CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.smsService.sendCampaign(biz, user.id, id);
  }

  @Delete('campaigns/:id')
  @ApiOperation({ summary: 'Delete campaign' })
  deleteCampaign(@BusinessId() biz: string, @Param('id') id: string) {
    return this.smsService.deleteCampaign(biz, id);
  }

  // ── Quick Send ───────────────────────────────────────────────────────────

  @Post('send')
  @ApiOperation({ summary: 'Quick send SMS' })
  quickSend(@BusinessId() biz: string, @CurrentUser() user: UserEntity, @Body() dto: QuickSendSmsDto) {
    return this.smsService.quickSend(biz, user.id, dto);
  }

  // ── Logs ─────────────────────────────────────────────────────────────────

  @Get('logs')
  @ApiOperation({ summary: 'Get SMS logs' })
  getLogs(@BusinessId() biz: string, @Query() q: GetSmsLogsDto) {
    return this.smsService.getLogs(biz, q);
  }

  // ── Configuration ─────────────────────────────────────────────────────────

  @Get('config')
  @ApiOperation({ summary: 'Get SMS gateway config' })
  getConfig(@BusinessId() biz: string) {
    return this.smsService.getConfig(biz);
  }

  @Post('config')
  @ApiOperation({ summary: 'Save SMS gateway config' })
  saveConfig(@BusinessId() biz: string, @Body() dto: SaveSmsConfigDto) {
    return this.smsService.saveConfig(biz, dto);
  }

  @Post('config/test')
  @ApiOperation({ summary: 'Send test SMS' })
  testSms(@BusinessId() biz: string, @Body() dto: TestSmsDto) {
    return this.smsService.testSms(biz, dto);
  }

  // ── Packages & Credits ────────────────────────────────────────────────────

  @Get('packages')
  @ApiOperation({ summary: 'Get available SMS packages' })
  getPackages() {
    return this.smsService.getPackages();
  }

  @Get('credits')
  @ApiOperation({ summary: 'Get credit balance and history' })
  getCredits(@BusinessId() biz: string) {
    return this.smsService.getCreditBalance(biz);
  }

  @Post('credits/purchase')
  @ApiOperation({ summary: 'Purchase SMS package' })
  purchasePackage(@BusinessId() biz: string, @CurrentUser() user: UserEntity, @Body() dto: PurchasePackageDto) {
    return this.smsService.purchasePackage(biz, user.id, dto);
  }

  // ── Due Reminder ──────────────────────────────────────────────────────────

  @Post('due-reminders')
  @ApiOperation({ summary: 'Create due reminder rule' })
  createReminder(@BusinessId() biz: string, @Body() dto: CreateDueReminderDto) {
    return this.smsService.createReminder(biz, dto);
  }

  @Get('due-reminders')
  @ApiOperation({ summary: 'Get all reminder rules' })
  getReminders(@BusinessId() biz: string) {
    return this.smsService.findAllReminders(biz);
  }

  @Patch('due-reminders/:id')
  @ApiOperation({ summary: 'Update reminder rule' })
  updateReminder(@BusinessId() biz: string, @Param('id') id: string, @Body() dto: UpdateDueReminderDto) {
    return this.smsService.updateReminder(biz, id, dto);
  }

  @Post('due-reminders/:id/toggle')
  @ApiOperation({ summary: 'Toggle reminder active status' })
  toggleReminder(@BusinessId() biz: string, @Param('id') id: string) {
    return this.smsService.toggleReminder(biz, id);
  }

  @Post('due-reminders/:id/send')
  @ApiOperation({ summary: 'Manually trigger due reminder' })
  sendReminder(@BusinessId() biz: string, @CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.smsService.sendReminder(biz, user.id, id);
  }

  @Delete('due-reminders/:id')
  @ApiOperation({ summary: 'Delete reminder rule' })
  deleteReminder(@BusinessId() biz: string, @Param('id') id: string) {
    return this.smsService.deleteReminder(biz, id);
  }

  @Get('due-reminder-logs')
  @ApiOperation({ summary: 'Get due reminder logs' })
  getReminderLogs(@BusinessId() biz: string, @Query() q: GetDueReminderLogsDto) {
    return this.smsService.getReminderLogs(biz, q);
  }
}
