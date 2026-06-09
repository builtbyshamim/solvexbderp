import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessEntity } from '../entities/business.entity';
import { SetupBusinessDto } from '../dto/setup-business.dto';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { UserRole } from 'src/common/shared/enums/user-role.enum';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { PackageEntity } from 'src/modules/packages/entities/package.entity';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(BusinessEntity)
    private readonly businessRepo: Repository<BusinessEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(PackageEntity)
    private readonly packageRepo: Repository<PackageEntity>,
    private readonly authService: AuthService,
  ) {}

  async setup(user: UserEntity, dto: SetupBusinessDto) {
    const existing = await this.businessRepo.findOne({
      where: { ownerId: user.id },
    });
    if (existing) {
      throw new ConflictException('Business already set up for this account.');
    }

    const business = this.businessRepo.create({
      ...dto,
      ownerId: user.id,
      currencyCode: dto.currencyCode ?? 'BDT',
    });

    const saved = await this.businessRepo.save(business);

    // Promote user to admin role
    await this.userRepo.update(user.id, { role: UserRole.ADMIN });
    const updatedUser = { ...user, role: UserRole.ADMIN } as UserEntity;

    // Generate new tokens with businessId embedded so tenant context works
    const tokens = await this.authService.generateTokens(updatedUser, saved.id);

    return {
      message: 'Business setup complete',
      business: saved,
      ...tokens,
    };
  }

  async findByOwner(ownerId: string): Promise<BusinessEntity | null> {
    return this.businessRepo.findOne({ where: { ownerId } });
  }

  async findById(id: string): Promise<BusinessEntity> {
    const biz = await this.businessRepo.findOne({ where: { id } });
    if (!biz) throw new NotFoundException('Business not found');
    return biz;
  }

  async update(
    ownerId: string,
    dto: Partial<SetupBusinessDto>,
  ): Promise<BusinessEntity> {
    const biz = await this.businessRepo.findOne({ where: { ownerId } });
    if (!biz) throw new NotFoundException('Business not found');
    Object.assign(biz, dto);
    return this.businessRepo.save(biz);
  }

  async subscribeToPackage(
    ownerId: string,
    packageId: string,
    billingCycle: 'monthly' | 'yearly',
  ) {
    const biz = await this.businessRepo.findOne({ where: { ownerId } });
    if (!biz) throw new NotFoundException('Business not found');

    const pkg = await this.packageRepo.findOne({ where: { id: packageId, isActive: true } });
    if (!pkg) throw new NotFoundException('Package not found');

    // Enterprise plans are handled manually by super admin
    if (pkg.isEnterprise) {
      throw new BadRequestException('Enterprise plan requires manual activation. Please contact support.');
    }

    const now = new Date();

    // If package has trial days, start trial period
    if (pkg.trialDays > 0 && !biz.packageId) {
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + pkg.trialDays);
      biz.trialEndsAt = trialEnd;
      biz.subscriptionExpiresAt = trialEnd;
      biz.subscriptionStatus = 'trial';
    } else {
      // Direct subscription (renew or no trial)
      const days = billingCycle === 'yearly' ? 365 : 30;
      const newExpiry = new Date(now);
      newExpiry.setDate(newExpiry.getDate() + days);
      biz.subscriptionExpiresAt = newExpiry;
      biz.subscriptionStatus = 'active';
    }

    biz.packageId = pkg.id;
    biz.subscriptionPlan = pkg.name;
    biz.billingCycle = billingCycle;

    const saved = await this.businessRepo.save(biz);

    return {
      message: biz.subscriptionStatus === 'trial'
        ? `Trial started for ${pkg.name} plan — ${pkg.trialDays} days free`
        : `Subscribed to ${pkg.name} plan`,
      subscription: this.formatSubscription(saved, pkg),
    };
  }

  async renewSubscription(
    ownerId: string,
    billingCycle: 'monthly' | 'yearly',
  ) {
    const biz = await this.businessRepo.findOne({ where: { ownerId } });
    if (!biz) throw new NotFoundException('Business not found');
    if (!biz.packageId) throw new BadRequestException('No active package. Please select a plan first.');

    const pkg = await this.packageRepo.findOne({ where: { id: biz.packageId } });
    if (!pkg) throw new NotFoundException('Package not found');

    const days = billingCycle === 'yearly' ? 365 : 30;
    const base = biz.subscriptionExpiresAt && biz.subscriptionExpiresAt > new Date()
      ? biz.subscriptionExpiresAt // extend from current expiry
      : new Date();               // expired — start fresh from now
    const newExpiry = new Date(base);
    newExpiry.setDate(newExpiry.getDate() + days);

    biz.subscriptionExpiresAt = newExpiry;
    biz.subscriptionStatus = 'active';
    biz.billingCycle = billingCycle;

    const saved = await this.businessRepo.save(biz);

    return {
      message: `Subscription renewed for ${pkg.name} plan`,
      subscription: this.formatSubscription(saved, pkg),
    };
  }

  private formatSubscription(biz: BusinessEntity, pkg: PackageEntity) {
    const now = new Date();
    const expiresAt = biz.subscriptionExpiresAt;
    const isExpired = expiresAt !== null && expiresAt <= now;
    const daysLeft = !expiresAt
      ? null
      : isExpired
        ? 0
        : Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      status: biz.subscriptionStatus,
      isActive: !isExpired,
      expiresAt: expiresAt?.toISOString() ?? null,
      trialEndsAt: biz.trialEndsAt?.toISOString() ?? null,
      daysLeft,
      billingCycle: biz.billingCycle,
      plan: pkg.name,
      packageId: pkg.id,
      package: {
        id: pkg.id,
        name: pkg.name,
        badge: pkg.badge,
        monthlyPrice: pkg.monthlyPrice,
        yearlyPrice: pkg.yearlyPrice,
        maxUsers: pkg.maxUsers,
        maxProducts: pkg.maxProducts,
        maxWarehouses: pkg.maxWarehouses,
      },
    };
  }
}
