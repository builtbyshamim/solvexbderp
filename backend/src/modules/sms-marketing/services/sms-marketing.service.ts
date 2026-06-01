import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike, FindOptionsWhere } from 'typeorm';
import { SmsTemplateEntity, SmsTemplateCategory } from '../entities/sms-template.entity';
import { SmsCampaignEntity, CampaignStatus, TargetType } from '../entities/sms-campaign.entity';
import { SmsLogEntity, SmsLogStatus } from '../entities/sms-log.entity';
import { SmsGroupEntity, SmsGroupMemberEntity } from '../entities/sms-group.entity';
import { SmsConfigEntity, SmsProvider } from '../entities/sms-config.entity';
import { SmsPackageEntity, SmsCreditEntity } from '../entities/sms-package.entity';
import { DueReminderEntity, DueReminderLogEntity, ReminderStatus } from '../entities/due-reminder.entity';
import {
  CreateSmsTemplateDto, UpdateSmsTemplateDto, GetSmsTemplatesDto,
  CreateSmsCampaignDto, UpdateSmsCampaignDto, GetSmsCampaignsDto,
  QuickSendSmsDto, GetSmsLogsDto,
  CreateSmsGroupDto, UpdateSmsGroupDto, GetSmsGroupsDto, GetGroupMembersDto, AddGroupMembersDto,
  SaveSmsConfigDto, TestSmsDto,
  PurchasePackageDto,
  CreateDueReminderDto, UpdateDueReminderDto, GetDueReminderLogsDto,
} from '../dto/sms-marketing.dto';
import { CustomerEntity } from 'src/modules/sales/entities/customer.entity';

@Injectable()
export class SmsMarketingService {
  constructor(
    @InjectRepository(SmsTemplateEntity)
    private readonly templateRepo: Repository<SmsTemplateEntity>,
    @InjectRepository(SmsCampaignEntity)
    private readonly campaignRepo: Repository<SmsCampaignEntity>,
    @InjectRepository(SmsLogEntity)
    private readonly logRepo: Repository<SmsLogEntity>,
    @InjectRepository(SmsGroupEntity)
    private readonly groupRepo: Repository<SmsGroupEntity>,
    @InjectRepository(SmsGroupMemberEntity)
    private readonly memberRepo: Repository<SmsGroupMemberEntity>,
    @InjectRepository(SmsConfigEntity)
    private readonly configRepo: Repository<SmsConfigEntity>,
    @InjectRepository(SmsPackageEntity)
    private readonly packageRepo: Repository<SmsPackageEntity>,
    @InjectRepository(SmsCreditEntity)
    private readonly creditRepo: Repository<SmsCreditEntity>,
    @InjectRepository(DueReminderEntity)
    private readonly reminderRepo: Repository<DueReminderEntity>,
    @InjectRepository(DueReminderLogEntity)
    private readonly reminderLogRepo: Repository<DueReminderLogEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // ── Dashboard Stats ──────────────────────────────────────────────────────

  async getStats(businessId: string) {
    const [totalSent, totalDelivered, totalFailed, totalTemplates, totalCampaigns, totalGroups] =
      await Promise.all([
        this.logRepo.count({ where: { businessId, status: SmsLogStatus.SENT } }),
        this.logRepo.count({ where: { businessId, status: SmsLogStatus.DELIVERED } }),
        this.logRepo.count({ where: { businessId, status: SmsLogStatus.FAILED } }),
        this.templateRepo.count({ where: { businessId } }),
        this.campaignRepo.count({ where: { businessId } }),
        this.groupRepo.count({ where: { businessId } }),
      ]);

    const totalMessages = totalSent + totalDelivered + totalFailed;
    const deliveryRate = totalMessages > 0
      ? Math.round(((totalSent + totalDelivered) / totalMessages) * 100) : 0;

    const credits = await this.getCreditBalance(businessId);

    const recentCampaigns = await this.campaignRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      totalSent: totalSent + totalDelivered,
      totalFailed,
      deliveryRate,
      totalTemplates,
      totalCampaigns,
      totalGroups,
      creditBalance: credits.remaining,
      recentCampaigns,
    };
  }

  // ── Templates ────────────────────────────────────────────────────────────

  async createTemplate(businessId: string, dto: CreateSmsTemplateDto) {
    const template = this.templateRepo.create({
      ...dto,
      businessId,
      characterCount: dto.content.length,
      usageCount: 0,
    });
    return this.templateRepo.save(template);
  }

  async findAllTemplates(businessId: string, query: GetSmsTemplatesDto) {
    const { search = '', category, page = 1, limit = 10 } = query;
    const where: FindOptionsWhere<SmsTemplateEntity> = { businessId };
    if (search) where.name = ILike(`%${search}%`);
    if (category) where.category = category as SmsTemplateCategory;

    const [data, totalItems] = await this.templateRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  async findTemplate(businessId: string, id: string) {
    const template = await this.templateRepo.findOne({ where: { businessId, id } });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async updateTemplate(businessId: string, id: string, dto: UpdateSmsTemplateDto) {
    const template = await this.findTemplate(businessId, id);
    Object.assign(template, dto);
    if (dto.content) template.characterCount = dto.content.length;
    return this.templateRepo.save(template);
  }

  async deleteTemplate(businessId: string, id: string) {
    const template = await this.findTemplate(businessId, id);
    await this.templateRepo.remove(template);
    return { message: 'Template deleted' };
  }

  // ── Groups ───────────────────────────────────────────────────────────────

  async createGroup(businessId: string, dto: CreateSmsGroupDto) {
    const group = this.groupRepo.create({ ...dto, businessId, memberCount: 0 });
    return this.groupRepo.save(group);
  }

  async findAllGroups(businessId: string, query: GetSmsGroupsDto) {
    const { search = '', page = 1, limit = 10 } = query;
    const where: FindOptionsWhere<SmsGroupEntity> = { businessId };
    if (search) where.name = ILike(`%${search}%`);

    const [data, totalItems] = await this.groupRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  async findGroup(businessId: string, id: string) {
    const group = await this.groupRepo.findOne({ where: { businessId, id } });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async updateGroup(businessId: string, id: string, dto: UpdateSmsGroupDto) {
    const group = await this.findGroup(businessId, id);
    Object.assign(group, dto);
    return this.groupRepo.save(group);
  }

  async deleteGroup(businessId: string, id: string) {
    const group = await this.findGroup(businessId, id);
    await this.memberRepo.delete({ businessId, groupId: id });
    await this.groupRepo.remove(group);
    return { message: 'Group deleted' };
  }

  async getGroupMembers(businessId: string, groupId: string, query: GetGroupMembersDto) {
    await this.findGroup(businessId, groupId);
    const { search = '', page = 1, limit = 20 } = query;

    const qb = this.memberRepo.createQueryBuilder('m')
      .where('m.businessId = :businessId AND m.groupId = :groupId', { businessId, groupId })
      .orderBy('m.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) qb.andWhere('(m.phone ILIKE :s OR m.name ILIKE :s)', { s: `%${search}%` });
    const [data, totalItems] = await qb.getManyAndCount();
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  async addGroupMembers(businessId: string, groupId: string, dto: AddGroupMembersDto) {
    await this.findGroup(businessId, groupId);

    const members = dto.members.map((m) =>
      this.memberRepo.create({ businessId, groupId, phone: m.phone, name: m.name, customerId: m.customerId })
    );
    await this.memberRepo.save(members);
    const count = await this.memberRepo.count({ where: { businessId, groupId } });
    await this.groupRepo.update({ id: groupId }, { memberCount: count });
    return { message: 'Members added', count };
  }

  async removeGroupMember(businessId: string, groupId: string, memberId: string) {
    await this.memberRepo.delete({ id: memberId, businessId, groupId });
    const count = await this.memberRepo.count({ where: { businessId, groupId } });
    await this.groupRepo.update({ id: groupId }, { memberCount: count });
    return { message: 'Member removed' };
  }

  async importCustomersToGroup(businessId: string, groupId: string) {
    await this.findGroup(businessId, groupId);
    const customers = await this.customerRepo.find({
      where: { businessId },
      select: ['id', 'name', 'phone'],
    });

    const existing = await this.memberRepo.find({ where: { businessId, groupId }, select: ['phone'] });
    const existingPhones = new Set(existing.map((m) => m.phone));

    const newMembers = customers
      .filter((c) => c.phone && !existingPhones.has(c.phone))
      .map((c) => this.memberRepo.create({ businessId, groupId, phone: c.phone!, name: c.name, customerId: c.id }));

    if (newMembers.length) await this.memberRepo.save(newMembers);
    const count = await this.memberRepo.count({ where: { businessId, groupId } });
    await this.groupRepo.update({ id: groupId }, { memberCount: count });
    return { message: `Imported ${newMembers.length} customers`, count };
  }

  // ── Campaigns ────────────────────────────────────────────────────────────

  async createCampaign(businessId: string, userId: string, dto: CreateSmsCampaignDto) {
    const campaign = this.campaignRepo.create({
      ...dto,
      businessId,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      status: dto.scheduledAt ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT,
      createdBy: userId,
    });
    return this.campaignRepo.save(campaign);
  }

  async findAllCampaigns(businessId: string, query: GetSmsCampaignsDto) {
    const { search = '', status, dateFrom, dateTo, page = 1, limit = 10 } = query;
    const qb = this.campaignRepo.createQueryBuilder('c')
      .where('c.businessId = :businessId', { businessId })
      .orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) qb.andWhere('c.name ILIKE :search', { search: `%${search}%` });
    if (status) qb.andWhere('c.status = :status', { status });
    if (dateFrom) qb.andWhere('c.createdAt >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('c.createdAt <= :dateTo', { dateTo });

    const [data, totalItems] = await qb.getManyAndCount();
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  async findCampaign(businessId: string, id: string) {
    const c = await this.campaignRepo.findOne({ where: { businessId, id } });
    if (!c) throw new NotFoundException('Campaign not found');
    return c;
  }

  async updateCampaign(businessId: string, id: string, dto: UpdateSmsCampaignDto) {
    const campaign = await this.findCampaign(businessId, id);
    if ([CampaignStatus.SENDING, CampaignStatus.COMPLETED].includes(campaign.status)) {
      throw new BadRequestException('Cannot update a campaign that is sending or completed');
    }
    Object.assign(campaign, dto);
    if (dto.scheduledAt) campaign.scheduledAt = new Date(dto.scheduledAt);
    return this.campaignRepo.save(campaign);
  }

  async deleteCampaign(businessId: string, id: string) {
    const campaign = await this.findCampaign(businessId, id);
    if (campaign.status === CampaignStatus.SENDING) throw new BadRequestException('Cannot delete a sending campaign');
    await this.campaignRepo.remove(campaign);
    return { message: 'Campaign deleted' };
  }

  async sendCampaign(businessId: string, userId: string, id: string) {
    const campaign = await this.findCampaign(businessId, id);
    if (campaign.status === CampaignStatus.COMPLETED) throw new BadRequestException('Campaign already completed');
    if (campaign.status === CampaignStatus.SENDING) throw new BadRequestException('Campaign is already being sent');

    let recipients: { phone: string; name: string }[] = [];

    if (campaign.targetType === TargetType.ALL_CUSTOMERS) {
      const customers = await this.customerRepo.find({ where: { businessId }, select: ['name', 'phone'] });
      recipients = customers.filter((c) => c.phone).map((c) => ({ phone: c.phone!, name: c.name }));
    } else if (campaign.targetType === TargetType.GROUP && campaign.groupId) {
      const members = await this.memberRepo.find({ where: { businessId, groupId: campaign.groupId } });
      recipients = members.map((m) => ({ phone: m.phone, name: m.name || 'Customer' }));
    } else if (campaign.targetType === TargetType.SPECIFIC_NUMBERS && campaign.recipientNumbers?.length) {
      recipients = campaign.recipientNumbers.map((p) => ({ phone: p, name: 'Customer' }));
    }

    if (!recipients.length) throw new BadRequestException('No valid recipients found');

    campaign.status = CampaignStatus.SENDING;
    campaign.totalCount = recipients.length;
    campaign.sentAt = new Date();
    await this.campaignRepo.save(campaign);

    return this.dataSource.transaction(async (tx) => {
      let sentCount = 0;
      let failedCount = 0;

      const logs = recipients.map((r) => {
        const ok = Math.random() > 0.05;
        if (ok) sentCount++; else failedCount++;
        return tx.getRepository(SmsLogEntity).create({
          businessId, campaignId: campaign.id, campaignName: campaign.name,
          recipientPhone: r.phone, recipientName: r.name,
          messageContent: campaign.messageContent,
          status: ok ? SmsLogStatus.SENT : SmsLogStatus.FAILED,
          sentAt: new Date(), sentBy: userId,
          errorMessage: ok ? undefined : 'Delivery failed',
        });
      });

      await tx.getRepository(SmsLogEntity).save(logs);

      if (campaign.templateId) {
        await tx.getRepository(SmsTemplateEntity).increment({ id: campaign.templateId }, 'usageCount', 1);
      }

      campaign.status = CampaignStatus.COMPLETED;
      campaign.sentCount = sentCount;
      campaign.failedCount = failedCount;
      await tx.getRepository(SmsCampaignEntity).save(campaign);

      return { message: 'Campaign sent', totalCount: recipients.length, sentCount, failedCount };
    });
  }

  // ── Quick Send ───────────────────────────────────────────────────────────

  async quickSend(businessId: string, userId: string, dto: QuickSendSmsDto) {
    if (!dto.phoneNumbers.length) throw new BadRequestException('At least one phone number required');

    const logs = dto.phoneNumbers.map((phone) => {
      const ok = Math.random() > 0.05;
      return this.logRepo.create({
        businessId, recipientPhone: phone,
        recipientName: dto.recipientName || 'Customer',
        messageContent: dto.message,
        status: ok ? SmsLogStatus.SENT : SmsLogStatus.FAILED,
        sentAt: new Date(), sentBy: userId,
        errorMessage: ok ? undefined : 'Delivery failed',
      });
    });

    await this.logRepo.save(logs);
    const sentCount = logs.filter((l) => l.status === SmsLogStatus.SENT).length;
    return { message: 'SMS sent', totalCount: dto.phoneNumbers.length, sentCount, failedCount: dto.phoneNumbers.length - sentCount };
  }

  // ── Logs ─────────────────────────────────────────────────────────────────

  async getLogs(businessId: string, query: GetSmsLogsDto) {
    const { search = '', status, campaignId, dateFrom, dateTo, page = 1, limit = 20 } = query;
    const qb = this.logRepo.createQueryBuilder('l')
      .where('l.businessId = :businessId', { businessId })
      .orderBy('l.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) qb.andWhere('(l.recipientPhone ILIKE :s OR l.recipientName ILIKE :s)', { s: `%${search}%` });
    if (status) qb.andWhere('l.status = :status', { status });
    if (campaignId) qb.andWhere('l.campaignId = :campaignId', { campaignId });
    if (dateFrom) qb.andWhere('l.sentAt >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('l.sentAt <= :dateTo', { dateTo });

    const [data, totalItems] = await qb.getManyAndCount();
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  // ── SMS Configuration ─────────────────────────────────────────────────────

  async getConfig(businessId: string) {
    let config = await this.configRepo.findOne({ where: { businessId } });
    if (!config) {
      config = this.configRepo.create({ businessId, provider: SmsProvider.SSL_WIRELESS, testMode: true });
      await this.configRepo.save(config);
    }
    // Mask API key for display
    const display = { ...config };
    if (display.apiKey && display.apiKey.length > 8) {
      display.apiKey = display.apiKey.slice(0, 4) + '••••••••' + display.apiKey.slice(-4);
    }
    return display;
  }

  async saveConfig(businessId: string, dto: SaveSmsConfigDto) {
    let config = await this.configRepo.findOne({ where: { businessId } });
    if (!config) {
      config = this.configRepo.create({ businessId });
    }
    Object.assign(config, dto);
    config.isConfigured = !!(dto.apiKey && dto.senderId);
    return this.configRepo.save(config);
  }

  async testSms(businessId: string, dto: TestSmsDto) {
    // Simulate test SMS send
    const ok = Math.random() > 0.1;
    return {
      success: ok,
      message: ok ? `Test SMS sent to ${dto.phone}` : 'Failed to send test SMS — check your configuration',
      provider: (await this.configRepo.findOne({ where: { businessId } }))?.provider ?? 'not configured',
    };
  }

  // ── Packages & Credits ────────────────────────────────────────────────────

  async getPackages() {
    let packages = await this.packageRepo.find({ where: { isActive: true }, order: { smsCount: 'ASC' } });
    if (!packages.length) {
      const defaults = [
        { name: 'Nano',         smsCount: 25,   bonusSms: 0, price: 15,   validityDays: 30, isActive: true, isPopular: false, color: '#94a3b8' },
        { name: 'Micro',        smsCount: 50,   bonusSms: 0, price: 29,   validityDays: 30, isActive: true, isPopular: false, color: '#64748b' },
        { name: 'Starter',      smsCount: 100,  bonusSms: 0, price: 55,   validityDays: 30, isActive: true, isPopular: false, color: '#22c55e' },
        { name: 'Mini',         smsCount: 200,  bonusSms: 0, price: 105,  validityDays: 30, isActive: true, isPopular: false, color: '#16a34a' },
        { name: 'Basic',        smsCount: 350,  bonusSms: 0, price: 180,  validityDays: 30, isActive: true, isPopular: false, color: '#06b6d4' },
        { name: 'Standard',     smsCount: 500,  bonusSms: 0, price: 245,  validityDays: 30, isActive: true, isPopular: false, color: '#0891b2' },
        { name: 'Plus',         smsCount: 700,  bonusSms: 0, price: 330,  validityDays: 30, isActive: true, isPopular: false, color: '#3b82f6' },
        { name: 'Business',     smsCount: 1000, bonusSms: 0, price: 450,  validityDays: 30, isActive: true, isPopular: true,  color: '#ff6d29' },
        { name: 'Business Plus',smsCount: 1500, bonusSms: 0, price: 645,  validityDays: 30, isActive: true, isPopular: false, color: '#f97316' },
        { name: 'Growth',       smsCount: 2000, bonusSms: 0, price: 820,  validityDays: 30, isActive: true, isPopular: false, color: '#a855f7' },
        { name: 'Growth Plus',  smsCount: 2500, bonusSms: 0, price: 1000, validityDays: 30, isActive: true, isPopular: false, color: '#9333ea' },
        { name: 'Premium',      smsCount: 3000, bonusSms: 0, price: 1170, validityDays: 30, isActive: true, isPopular: false, color: '#ec4899' },
        { name: 'Premium Plus', smsCount: 3500, bonusSms: 0, price: 1330, validityDays: 30, isActive: true, isPopular: false, color: '#db2777' },
        { name: 'Corporate',    smsCount: 4000, bonusSms: 0, price: 1480, validityDays: 30, isActive: true, isPopular: false, color: '#6366f1' },
        { name: 'Corporate Plus',smsCount: 4500,bonusSms: 0, price: 1620, validityDays: 30, isActive: true, isPopular: false, color: '#4f46e5' },
        { name: 'Enterprise',   smsCount: 5000, bonusSms: 0, price: 1750, validityDays: 60, isActive: true, isPopular: false, color: '#dc2626' },
      ];
      packages = await this.packageRepo.save(defaults.map((d) => Object.assign(this.packageRepo.create(), d)));
    }
    return packages;
  }

  async getCreditBalance(businessId: string) {
    const credits = await this.creditRepo.find({ where: { businessId }, order: { createdAt: 'DESC' } });
    const remaining = credits.reduce((sum, c) => sum + (c.remainingCredits || 0), 0);
    const total = credits.reduce((sum, c) => sum + (c.totalCredits || 0), 0);
    const used = credits.reduce((sum, c) => sum + (c.usedCredits || 0), 0);
    return { remaining, total, used, history: credits };
  }

  async purchasePackage(businessId: string, userId: string, dto: PurchasePackageDto) {
    const pkg = await this.packageRepo.findOne({ where: { id: dto.packageId } });
    if (!pkg) throw new NotFoundException('Package not found');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pkg.validityDays);

    const credit = this.creditRepo.create({
      businessId,
      packageId: pkg.id,
      packageName: pkg.name,
      totalCredits: pkg.smsCount + pkg.bonusSms,
      usedCredits: 0,
      remainingCredits: pkg.smsCount + pkg.bonusSms,
      amountPaid: pkg.price,
      expiresAt,
      purchasedBy: userId,
    });

    await this.creditRepo.save(credit);
    return { message: 'Package purchased successfully', credit };
  }

  async getCreditHistory(businessId: string) {
    return this.creditRepo.find({ where: { businessId }, order: { createdAt: 'DESC' } });
  }

  // ── Due Reminder ─────────────────────────────────────────────────────────

  async createReminder(businessId: string, dto: CreateDueReminderDto) {
    const reminder = this.reminderRepo.create({ ...dto, businessId, totalSent: 0 });
    return this.reminderRepo.save(reminder);
  }

  async findAllReminders(businessId: string) {
    return this.reminderRepo.find({ where: { businessId }, order: { createdAt: 'DESC' } });
  }

  async findReminder(businessId: string, id: string) {
    const r = await this.reminderRepo.findOne({ where: { businessId, id } });
    if (!r) throw new NotFoundException('Reminder not found');
    return r;
  }

  async updateReminder(businessId: string, id: string, dto: UpdateDueReminderDto) {
    const reminder = await this.findReminder(businessId, id);
    Object.assign(reminder, dto);
    return this.reminderRepo.save(reminder);
  }

  async toggleReminder(businessId: string, id: string) {
    const reminder = await this.findReminder(businessId, id);
    reminder.isActive = !reminder.isActive;
    return this.reminderRepo.save(reminder);
  }

  async deleteReminder(businessId: string, id: string) {
    const reminder = await this.findReminder(businessId, id);
    await this.reminderRepo.remove(reminder);
    return { message: 'Reminder deleted' };
  }

  async sendReminder(businessId: string, userId: string, id: string) {
    const reminder = await this.findReminder(businessId, id);

    // Get customers with due balance
    const customers = await this.customerRepo.find({
      where: { businessId },
      select: ['id', 'name', 'phone', 'currentBalance'],
    });

    const dueCustomers = customers.filter((c) => {
      const balance = Number(c.currentBalance);
      return c.phone && balance > 0 && balance >= (reminder.minAmount || 0);
    });

    if (!dueCustomers.length) throw new BadRequestException('No customers with due balance found');

    return this.dataSource.transaction(async (tx) => {
      const logs = dueCustomers.map((c) => {
        const ok = Math.random() > 0.05;
        const msg = reminder.message
          .replace('{name}', c.name)
          .replace('{amount}', `৳${Number(c.currentBalance).toLocaleString()}`);

        return tx.getRepository(DueReminderLogEntity).create({
          businessId,
          reminderId: reminder.id,
          reminderName: reminder.name,
          customerId: c.id,
          customerName: c.name,
          phone: c.phone!,
          dueAmount: Number(c.currentBalance),
          messageContent: msg,
          status: ok ? ReminderStatus.SENT : ReminderStatus.FAILED,
          sentAt: new Date(),
        });
      });

      await tx.getRepository(DueReminderLogEntity).save(logs);
      reminder.lastRunAt = new Date();
      reminder.totalSent = (reminder.totalSent || 0) + dueCustomers.length;
      await tx.getRepository(DueReminderEntity).save(reminder);

      return {
        message: 'Reminder sent',
        totalCount: dueCustomers.length,
        sentCount: logs.filter((l) => l.status === ReminderStatus.SENT).length,
        failedCount: logs.filter((l) => l.status === ReminderStatus.FAILED).length,
      };
    });
  }

  async getReminderLogs(businessId: string, query: GetDueReminderLogsDto) {
    const { reminderId, search = '', dateFrom, dateTo, page = 1, limit = 20 } = query;
    const qb = this.reminderLogRepo.createQueryBuilder('l')
      .where('l.businessId = :businessId', { businessId })
      .orderBy('l.sentAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (reminderId) qb.andWhere('l.reminderId = :reminderId', { reminderId });
    if (search) qb.andWhere('(l.customerName ILIKE :s OR l.phone ILIKE :s)', { s: `%${search}%` });
    if (dateFrom) qb.andWhere('l.sentAt >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('l.sentAt <= :dateTo', { dateTo });

    const [data, totalItems] = await qb.getManyAndCount();
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }
}
