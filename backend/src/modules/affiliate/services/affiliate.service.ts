import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AffiliateEntity, AffiliateStatus } from '../entities/affiliate.entity';
import { AffiliateReferralEntity } from '../entities/affiliate-referral.entity';
import { AffiliateCommissionEntity, CommissionStatus } from '../entities/affiliate-commission.entity';
import { AffiliatePayoutEntity } from '../entities/affiliate-payout.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
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

@Injectable()
export class AffiliateService {
  constructor(
    @InjectRepository(AffiliateEntity)
    private readonly affiliateRepo: Repository<AffiliateEntity>,
    @InjectRepository(AffiliateReferralEntity)
    private readonly referralRepo: Repository<AffiliateReferralEntity>,
    @InjectRepository(AffiliateCommissionEntity)
    private readonly commissionRepo: Repository<AffiliateCommissionEntity>,
    @InjectRepository(AffiliatePayoutEntity)
    private readonly payoutRepo: Repository<AffiliatePayoutEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // ─── User: Apply to become affiliate ────────────────────────────────────────

  async apply(userId: string, dto: ApplyAffiliateDto) {
    const existing = await this.affiliateRepo.findOne({ where: { userId } });
    if (existing) {
      if (existing.status === AffiliateStatus.REJECTED) {
        existing.status = AffiliateStatus.PENDING;
        Object.assign(existing, dto);
        return this.affiliateRepo.save(existing);
      }
      throw new ConflictException('You have already applied for the affiliate program');
    }
    const affiliate = this.affiliateRepo.create({ userId, ...dto });
    return this.affiliateRepo.save(affiliate);
  }

  // ─── User: Get my affiliate info ─────────────────────────────────────────────

  async getMyAffiliate(userId: string) {
    const affiliate = await this.affiliateRepo.findOne({ where: { userId }, relations: ['user'] });
    if (!affiliate) return null;

    const referralCount = await this.referralRepo.count({ where: { affiliateId: affiliate.id } });
    const pendingCommission = await this.commissionRepo
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.commissionAmount), 0)', 'total')
      .where('c.affiliateId = :id AND c.status = :s', { id: affiliate.id, s: CommissionStatus.APPROVED })
      .getRawOne();

    const user = await this.userRepo.findOne({ where: { id: userId } });
    return {
      ...affiliate,
      referralCode: user?.referralCode,
      referralCount,
      pendingCommission: Number(pendingCommission?.total ?? 0),
    };
  }

  async getMyReferrals(userId: string, page = 1, limit = 20) {
    const affiliate = await this.getActiveAffiliate(userId);
    const [data, total] = await this.referralRepo.findAndCount({
      where: { affiliateId: affiliate.id },
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    });
    return { data, meta: { total, page, limit } };
  }

  async getMyCommissions(userId: string, page = 1, limit = 20) {
    const affiliate = await this.affiliateRepo.findOne({ where: { userId } });
    if (!affiliate) throw new NotFoundException('Affiliate profile not found');

    const [data, total] = await this.commissionRepo.findAndCount({
      where: { affiliateId: affiliate.id },
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    });
    return { data, meta: { total, page, limit } };
  }

  // ─── Admin: List affiliates ──────────────────────────────────────────────────

  async findAll(query: AffiliateQueryDto) {
    const { page = 1, limit = 20, search, status } = query;
    const qb = this.affiliateRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.user', 'user')
      .orderBy('a.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    if (status) qb.andWhere('a.status = :status', { status });
    if (search) {
      qb.andWhere(
        '(user.name ILIKE :s OR user.email ILIKE :s OR user.mobile ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  // ─── Admin: Get one affiliate with full stats ────────────────────────────────

  async findOne(id: string) {
    const affiliate = await this.affiliateRepo.findOne({ where: { id }, relations: ['user'] });
    if (!affiliate) throw new NotFoundException('Affiliate not found');

    const referralCount = await this.referralRepo.count({ where: { affiliateId: id } });
    const commissions = await this.commissionRepo.find({
      where: { affiliateId: id },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    const payouts = await this.payoutRepo.find({
      where: { affiliateId: id },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const user = await this.userRepo.findOne({ where: { id: affiliate.userId } });
    return { ...affiliate, referralCode: user?.referralCode, referralCount, commissions, payouts };
  }

  // ─── Admin: Update affiliate status ─────────────────────────────────────────

  async updateStatus(id: string, dto: UpdateAffiliateStatusDto) {
    const affiliate = await this.affiliateRepo.findOne({ where: { id } });
    if (!affiliate) throw new NotFoundException('Affiliate not found');
    affiliate.status = dto.status;
    if (dto.notes) affiliate.notes = dto.notes;
    return this.affiliateRepo.save(affiliate);
  }

  // ─── Admin: Update commission rate ──────────────────────────────────────────

  async updateCommissionRate(id: string, dto: UpdateCommissionRateDto) {
    const affiliate = await this.affiliateRepo.findOne({ where: { id } });
    if (!affiliate) throw new NotFoundException('Affiliate not found');
    affiliate.commissionRate = dto.commissionRate;
    return this.affiliateRepo.save(affiliate);
  }

  // ─── Admin: Sync referrals from user registrations ──────────────────────────

  async syncReferrals(affiliateId: string) {
    const affiliate = await this.affiliateRepo.findOne({
      where: { id: affiliateId },
      relations: ['user'],
    });
    if (!affiliate) throw new NotFoundException('Affiliate not found');

    const referralCode = affiliate.user.referralCode;
    if (!referralCode) return { synced: 0 };

    const users = await this.userRepo.find({ where: { referredBy: referralCode } });
    let synced = 0;

    for (const u of users) {
      const exists = await this.referralRepo.findOne({ where: { referredUserId: u.id } });
      if (!exists) {
        await this.referralRepo.save(
          this.referralRepo.create({ affiliateId, referredUserId: u.id }),
        );
        synced++;
      }
    }

    return { synced, total: users.length };
  }

  // ─── Admin: Record a single commission ──────────────────────────────────────

  async recordCommission(dto: RecordCommissionDto, adminId: string) {
    const affiliate = await this.affiliateRepo.findOne({ where: { id: dto.affiliateId } });
    if (!affiliate) throw new NotFoundException('Affiliate not found');
    if (affiliate.status !== AffiliateStatus.ACTIVE) {
      throw new BadRequestException('Affiliate is not active');
    }

    const exists = await this.commissionRepo.findOne({
      where: { affiliateId: dto.affiliateId, referralId: dto.referralId, month: dto.month, year: dto.year },
    });
    if (exists) throw new ConflictException('Commission already recorded for this referral/month/year');

    const commissionAmount = Number(
      ((dto.subscriptionAmount * Number(affiliate.commissionRate)) / 100).toFixed(2),
    );

    return this.commissionRepo.save(
      this.commissionRepo.create({
        affiliateId: dto.affiliateId,
        referralId: dto.referralId,
        month: dto.month,
        year: dto.year,
        subscriptionAmount: dto.subscriptionAmount,
        commissionRate: Number(affiliate.commissionRate),
        commissionAmount,
        status: CommissionStatus.PENDING,
        note: dto.note,
      }),
    );
  }

  // ─── Admin: Generate commissions for all active referrals in a month ────────

  async generateMonthlyCommissions(dto: GenerateMonthlyCommissionsDto, adminId: string) {
    const affiliates = await this.affiliateRepo.find({ where: { status: AffiliateStatus.ACTIVE } });
    let created = 0;
    let skipped = 0;

    for (const affiliate of affiliates) {
      const referrals = await this.referralRepo.find({
        where: { affiliateId: affiliate.id, isActive: true },
      });

      for (const referral of referrals) {
        const exists = await this.commissionRepo.findOne({
          where: { affiliateId: affiliate.id, referralId: referral.id, month: dto.month, year: dto.year },
        });
        if (exists) { skipped++; continue; }

        const commissionAmount = Number(
          ((dto.subscriptionAmount * Number(affiliate.commissionRate)) / 100).toFixed(2),
        );

        await this.commissionRepo.save(
          this.commissionRepo.create({
            affiliateId: affiliate.id,
            referralId: referral.id,
            month: dto.month,
            year: dto.year,
            subscriptionAmount: dto.subscriptionAmount,
            commissionRate: Number(affiliate.commissionRate),
            commissionAmount,
            note: dto.note,
          }),
        );
        created++;
      }
    }

    return { created, skipped };
  }

  // ─── Admin: Update commission status ────────────────────────────────────────

  async updateCommissionStatus(commissionId: string, dto: UpdateCommissionStatusDto, adminId: string) {
    const commission = await this.commissionRepo.findOne({ where: { id: commissionId } });
    if (!commission) throw new NotFoundException('Commission not found');

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const prev = commission.status;
      commission.status = dto.status;
      if (dto.note) commission.note = dto.note;

      if (dto.status === CommissionStatus.APPROVED && prev !== CommissionStatus.APPROVED) {
        commission.approvedBy = adminId;
        commission.approvedAt = new Date();
        await qr.manager.increment(
          AffiliateEntity,
          { id: commission.affiliateId },
          'totalEarned',
          Number(commission.commissionAmount),
        );
        await qr.manager.increment(
          AffiliateEntity,
          { id: commission.affiliateId },
          'balance',
          Number(commission.commissionAmount),
        );
      }

      if (dto.status === CommissionStatus.CANCELLED && prev === CommissionStatus.APPROVED) {
        await qr.manager.decrement(
          AffiliateEntity,
          { id: commission.affiliateId },
          'totalEarned',
          Number(commission.commissionAmount),
        );
        await qr.manager.decrement(
          AffiliateEntity,
          { id: commission.affiliateId },
          'balance',
          Number(commission.commissionAmount),
        );
      }

      await qr.manager.save(AffiliateCommissionEntity, commission);
      await qr.commitTransaction();
      return commission;
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  // ─── Admin: List commissions ─────────────────────────────────────────────────

  async findCommissions(query: CommissionQueryDto) {
    const { page = 1, limit = 20, affiliateId, status, month, year } = query;
    const qb = this.commissionRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.affiliate', 'a')
      .leftJoinAndSelect('a.user', 'u')
      .orderBy('c.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    if (affiliateId) qb.andWhere('c.affiliateId = :affiliateId', { affiliateId });
    if (status) qb.andWhere('c.status = :status', { status });
    if (month) qb.andWhere('c.month = :month', { month });
    if (year) qb.andWhere('c.year = :year', { year });

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  // ─── Admin: Create payout ────────────────────────────────────────────────────

  async createPayout(dto: CreatePayoutDto, adminId: string) {
    const affiliate = await this.affiliateRepo.findOne({ where: { id: dto.affiliateId } });
    if (!affiliate) throw new NotFoundException('Affiliate not found');

    if (Number(affiliate.balance) < dto.amount) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${affiliate.balance}, Requested: ${dto.amount}`,
      );
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const payout = await qr.manager.save(
        AffiliatePayoutEntity,
        qr.manager.create(AffiliatePayoutEntity, {
          affiliateId: dto.affiliateId,
          amount: dto.amount,
          method: dto.method,
          transactionRef: dto.transactionRef,
          note: dto.note,
          processedBy: adminId,
        }),
      );

      await qr.manager.decrement(
        AffiliateEntity,
        { id: dto.affiliateId },
        'balance',
        dto.amount,
      );
      await qr.manager.increment(
        AffiliateEntity,
        { id: dto.affiliateId },
        'totalPaid',
        dto.amount,
      );

      await qr.commitTransaction();
      return payout;
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  // ─── Admin: List payouts ─────────────────────────────────────────────────────

  async findPayouts(affiliateId?: string, page = 1, limit = 20) {
    const where: any = {};
    if (affiliateId) where.affiliateId = affiliateId;

    const [data, total] = await this.payoutRepo.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
      relations: ['affiliate', 'affiliate.user'],
    });
    return { data, meta: { total, page, limit } };
  }

  // ─── Admin: Platform stats ───────────────────────────────────────────────────

  async getStats() {
    const total = await this.affiliateRepo.count();
    const active = await this.affiliateRepo.count({ where: { status: AffiliateStatus.ACTIVE } });
    const pending = await this.affiliateRepo.count({ where: { status: AffiliateStatus.PENDING } });
    const totalReferrals = await this.referralRepo.count();
    const pendingCommissions = await this.commissionRepo
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.commissionAmount), 0)', 'total')
      .where('c.status = :s', { s: CommissionStatus.PENDING })
      .getRawOne();
    const approvedCommissions = await this.commissionRepo
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.commissionAmount), 0)', 'total')
      .where('c.status = :s', { s: CommissionStatus.APPROVED })
      .getRawOne();
    const totalPaidOut = await this.payoutRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .getRawOne();

    return {
      totalAffiliates: total,
      activeAffiliates: active,
      pendingApplications: pending,
      totalReferrals,
      pendingCommissionAmount: Number(pendingCommissions?.total ?? 0),
      approvedCommissionAmount: Number(approvedCommissions?.total ?? 0),
      totalPaidOut: Number(totalPaidOut?.total ?? 0),
    };
  }

  // ─── Internal helper ────────────────────────────────────────────────────────

  private async getActiveAffiliate(userId: string) {
    const affiliate = await this.affiliateRepo.findOne({ where: { userId } });
    if (!affiliate) throw new NotFoundException('Affiliate profile not found');
    if (affiliate.status !== AffiliateStatus.ACTIVE) {
      throw new BadRequestException('Affiliate account is not active');
    }
    return affiliate;
  }
}
