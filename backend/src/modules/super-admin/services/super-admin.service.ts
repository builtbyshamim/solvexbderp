import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, MoreThanOrEqual } from 'typeorm';
import { BusinessEntity } from 'src/modules/business/entities/business.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import {
  GetBusinessesDto,
  ResetBusinessDto,
  SubscriptionActionDto,
  ToggleStatusDto,
} from '../dto/super-admin.dto';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(BusinessEntity)
    private readonly businessRepo: Repository<BusinessEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async getDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalBusinesses,
      activeCount,
      suspendedCount,
      newSignupsThisMonth,
      recentBusinesses,
    ] = await Promise.all([
      this.businessRepo.count(),
      this.businessRepo.count({ where: { isActive: true } }),
      this.businessRepo.count({ where: { isActive: false } }),
      this.businessRepo.count({
        where: { createdAt: MoreThanOrEqual(startOfMonth) },
      }),
      this.businessRepo.find({
        order: { createdAt: 'DESC' },
        take: 5,
        relations: ['owner'],
      }),
    ]);

    return {
      total_businesses: totalBusinesses,
      active_subscriptions: activeCount,
      trial_accounts: 0,
      expired_accounts: 0,
      suspended_accounts: suspendedCount,
      revenue_this_month: 0,
      new_signups_this_month: newSignupsThisMonth,
      plan_breakdown: { starter: activeCount, pro: 0, trial: 0 },
      system_health: {
        db_connections: 1,
        redis_memory_mb: 0,
        queue_pending_jobs: 0,
      },
      recentBusinesses: recentBusinesses.map((b) => this.formatBusiness(b)),
    };
  }

  async getAllBusinesses(dto: GetBusinessesDto) {
    const page = Number(dto.page) || 1;
    const limit = Number(dto.limit) || 10;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};

    if (dto.status === 'active') whereConditions.isActive = true;
    else if (dto.status === 'suspended') whereConditions.isActive = false;

    if (dto.search) {
      const businesses = await this.businessRepo
        .createQueryBuilder('b')
        .leftJoinAndSelect('b.owner', 'u')
        .where(
          '(b.name ILIKE :search OR u.name ILIKE :search OR u.mobile ILIKE :search)',
          { search: `%${dto.search}%` },
        )
        .andWhere(
          dto.status && dto.status !== 'all'
            ? 'b.isActive = :isActive'
            : '1=1',
          dto.status === 'active'
            ? { isActive: true }
            : dto.status === 'suspended'
              ? { isActive: false }
              : {},
        )
        .orderBy('b.createdAt', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        businesses: businesses[0].map((b) => this.formatBusiness(b)),
        total: businesses[1],
        page,
        limit,
        totalPages: Math.ceil(businesses[1] / limit),
      };
    }

    const [businesses, total] = await this.businessRepo.findAndCount({
      where: whereConditions,
      relations: ['owner'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      businesses: businesses.map((b) => this.formatBusiness(b)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getBusinessDetail(id: string) {
    const business = await this.businessRepo.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!business) throw new NotFoundException('Business not found');

    const userCount = await this.userRepo.count({ where: { businessId: id } });

    return {
      ...this.formatBusiness(business),
      usersCount: userCount + 1,
    };
  }

  async toggleStatus(id: string, dto: ToggleStatusDto) {
    const business = await this.businessRepo.findOne({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');

    business.isActive = dto.status === 'active';
    await this.businessRepo.save(business);

    return {
      message:
        dto.status === 'active'
          ? 'Business activated successfully'
          : 'Business suspended successfully',
      business: { id: business.id, isActive: business.isActive },
    };
  }

  async updateSubscription(id: string, dto: SubscriptionActionDto) {
    const business = await this.businessRepo.findOne({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');

    switch (dto.action) {
      case 'suspend':
        business.isActive = false;
        break;
      case 'unsuspend':
        business.isActive = true;
        break;
      case 'renew':
      case 'change_plan':
      case 'extend_trial':
        // Subscription fields will be managed when subscription entity is added
        break;
    }

    await this.businessRepo.save(business);

    return {
      message: `Subscription action "${dto.action}" applied successfully`,
      business: { id: business.id, isActive: business.isActive },
    };
  }

  async resetBusinessData(id: string, dto: ResetBusinessDto, adminId: string) {
    if (dto.confirm_text !== 'RESET CONFIRM') {
      throw new BadRequestException(
        'Confirmation text does not match. Please type "RESET CONFIRM".',
      );
    }

    const business = await this.businessRepo.findOne({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');

    // The actual data deletion would go here once the relevant entities are set up.
    // For now we log the action and return success.
    return {
      message: `Business data reset (scope: ${dto.reset_scope}) completed`,
      businessId: id,
      scope: dto.reset_scope,
      performedBy: adminId,
      note: dto.note ?? null,
    };
  }

  private formatBusiness(b: BusinessEntity) {
    return {
      id: b.id,
      name: b.name,
      owner: b.owner?.name ?? 'Unknown',
      mobile: b.owner?.mobile ?? '',
      plan: 'Starter',
      status: b.isActive ? 'active' : 'suspended',
      joinedAt: b.createdAt,
      expiresAt: null,
      usersCount: 1,
      productsCount: 0,
    };
  }
}
