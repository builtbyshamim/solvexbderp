import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource, ILike, Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AuthService } from 'src/modules/auth/services/auth.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { MailService } from 'src/modules/mail/mail.service';
import { RegisterMailTemplate } from 'src/modules/mail/mail-template/RegisterMailTemplate';
import { v4 as uuidv4 } from 'uuid';
import { GetAllUsersDto } from '../dto/get-all-users.dto';
import { Permission, UserRole } from 'src/common/shared/enums/user-role.enum';
import { ROLE_PERMISSIONS } from 'src/common/config/role-permissions.config';
import { InviteUserDto } from '../dto/invite-user.dto';
import { BusinessEntity } from 'src/modules/business/entities/business.entity';
import { PackageEntity } from 'src/modules/packages/entities/package.entity';

const OTP_TTL = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_RESEND = 3;
const RESEND_WINDOW = 10 * 60 * 1000;

export interface PendingSignup {
  email: string;
  name: string | null;
  password: string;
  referralId: string | null;
  otpHash: string;
  attempts: number;
  resendCount: number;
  resendWindowStart: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly authService: AuthService,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly mailService: MailService,
  ) {}

  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  private safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  async initiateRegistration(dto: RegisterUserDto) {
    const { email, password, referralId, name } = dto;

    const exists = await this.userRepository.findOne({ where: { email } });
    if (exists) throw new ConflictException('Email already exists');

    if (referralId) {
      const referrer = await this.userRepository.findOne({
        where: { referralCode: referralId },
      });
      if (!referrer) throw new BadRequestException('Invalid referral ID');
    }

    const redisKey = `pending_signup:${email}`;
    const existing = await this.cacheManager.get<PendingSignup>(redisKey);
    if (existing) {
      const now = Date.now();
      const windowElapsed = now - existing.resendWindowStart;
      if (windowElapsed < RESEND_WINDOW && existing.resendCount >= MAX_RESEND) {
        throw new BadRequestException(
          'Too many OTP requests. Please wait 10 minutes before trying again.',
        );
      }
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = this.hashOtp(otp);
    const hashedPassword = await bcrypt.hash(password, 10);

    const payload: PendingSignup = {
      email,
      name: name ?? null,
      password: hashedPassword,
      referralId: referralId ?? null,
      otpHash,
      attempts: 0,
      resendCount: existing ? existing.resendCount + 1 : 1,
      resendWindowStart: existing?.resendWindowStart ?? Date.now(),
    };

    await this.cacheManager.set(redisKey, payload, OTP_TTL);
    await this.mailService.sendMail({
      to: email,
      subject: 'Email Verification OTP',
      html: RegisterMailTemplate(otp, 10),
      text: `Your OTP is: ${otp}. Valid for 10 minutes.`,
    });

    return { message: 'OTP sent to your email.' };
  }

  async findAll(query: GetAllUsersDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      role,
    } = query;

    const skip = (page - 1) * limit;
    const baseCondition: Record<string, any> = {};
    if (role) baseCondition.role = role;

    const whereConditions = search
      ? [
          { ...baseCondition, email: ILike(`%${search}%`) },
          { ...baseCondition, name: ILike(`%${search}%`) },
          { ...baseCondition, mobile: ILike(`%${search}%`) },
        ]
      : [baseCondition];

    const [users, totalItems] = await this.userRepository.findAndCount({
      where: whereConditions,
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
      select: [
        'id',
        'email',
        'name',
        'mobile',
        'role',
        'avatar',
        'isVerified',
        'isBanned',
        'isDeleted',
        'referralCode',
        'referralCount',
        'businessId',
        'customPermissions',
        'createdAt',
        'updatedAt',
      ],
    });

    return {
      data: users,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: Number(page),
        limit: Number(limit),
      },
    };
  }

  async findById(id: string) {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async findOneWithPermissions(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'name',
        'mobile',
        'role',
        'avatar',
        'isVerified',
        'isBanned',
        'isDeleted',
        'businessId',
        'customPermissions',
        'createdAt',
        'updatedAt',
      ],
    });
    if (!user) throw new NotFoundException('User not found');

    const rolePerms = ROLE_PERMISSIONS[user.role] ?? [];
    const custom = user.customPermissions ?? [];
    const effective = Array.from(new Set([...rolePerms, ...custom]));

    // Load subscription info from business
    const subscription = await this.resolveSubscription(user);

    return {
      ...user,
      rolePermissions: rolePerms,
      effectivePermissions: effective,
      subscription,
    };
  }

  private async resolveSubscription(user: UserEntity) {
    if (user.role === UserRole.SUPER_ADMIN) {
      return { status: 'active', isActive: true, expiresAt: null, daysLeft: null, needsPackageSelection: false };
    }

    const bizRepo = this.dataSource.getRepository(BusinessEntity);
    const pkgRepo = this.dataSource.getRepository(PackageEntity);

    let business: BusinessEntity | null = null;
    if (user.businessId) {
      business = await bizRepo.findOne({ where: { id: user.businessId } });
    }
    if (!business && user.role === UserRole.ADMIN) {
      business = await bizRepo.findOne({ where: { ownerId: user.id } });
    }

    if (!business) {
      return { status: 'no_business', isActive: false, expiresAt: null, daysLeft: null, needsPackageSelection: false };
    }

    if (!business.isActive) {
      return { status: 'suspended', isActive: false, expiresAt: null, daysLeft: null, needsPackageSelection: false };
    }

    // No package selected yet — still in free onboarding
    const needsPackageSelection = !business.packageId;

    // Load package details if available
    let pkg: PackageEntity | null = null;
    if (business.packageId) {
      pkg = await pkgRepo.findOne({ where: { id: business.packageId } });
    }

    const now = new Date();
    const expiresAt = business.subscriptionExpiresAt;

    if (expiresAt === null) {
      return {
        status: business.subscriptionStatus ?? 'trial',
        isActive: true,
        expiresAt: null,
        trialEndsAt: business.trialEndsAt?.toISOString() ?? null,
        daysLeft: null,
        billingCycle: business.billingCycle,
        plan: business.subscriptionPlan,
        packageId: business.packageId,
        needsPackageSelection,
        package: pkg ? this.formatPackage(pkg) : null,
      };
    }

    const isExpired = expiresAt <= now;
    const daysLeft = isExpired
      ? 0
      : Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const status = isExpired ? 'expired' : (business.subscriptionStatus ?? 'trial');

    return {
      status,
      isActive: !isExpired,
      expiresAt: expiresAt.toISOString(),
      trialEndsAt: business.trialEndsAt?.toISOString() ?? null,
      daysLeft,
      billingCycle: business.billingCycle,
      plan: business.subscriptionPlan,
      packageId: business.packageId,
      needsPackageSelection,
      package: pkg ? this.formatPackage(pkg) : null,
    };
  }

  private formatPackage(pkg: PackageEntity) {
    return {
      id: pkg.id,
      name: pkg.name,
      badge: pkg.badge,
      highlight: pkg.highlight,
      monthlyPrice: Number(pkg.monthlyPrice),
      yearlyPrice: Number(pkg.yearlyPrice),
      maxUsers: pkg.maxUsers,
      maxProducts: pkg.maxProducts,
      maxWarehouses: pkg.maxWarehouses,
      features: pkg.features,
    };
  }

  async verifyOtp(email: string, otp: string) {
    const redisKey = `pending_signup:${email}`;
    console.log(`Verifying OTP for ${email} with OTP: ${otp}`);
    const data = await this.cacheManager.get<PendingSignup>(redisKey);
    if (!data) throw new BadRequestException('Invalid or expired OTP.');

    if (data.attempts >= MAX_ATTEMPTS) {
      await this.cacheManager.del(redisKey);
      throw new BadRequestException(
        'Too many incorrect attempts. Please register again.',
      );
    }

    const inputHash = this.hashOtp(otp);
    const isValid = this.safeCompare(inputHash, data.otpHash);

    if (!isValid) {
      await this.cacheManager.set(
        redisKey,
        { ...data, attempts: data.attempts + 1 },
        OTP_TTL,
      );
      const remaining = MAX_ATTEMPTS - (data.attempts + 1);
      throw new BadRequestException(
        `Invalid OTP. ${remaining} attempt(s) remaining.`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const raceCheck = await queryRunner.manager.findOne(UserEntity, {
        where: { email: data.email },
      });
      if (raceCheck) throw new ConflictException('Email already exists');

      const referralCode = this.generateReferralCode();
      const user = queryRunner.manager.create(UserEntity, {
        email: data.email,
        name: data.name ?? undefined,
        password: data.password,
        isVerified: true,
        referralCode,
        referredBy: data.referralId ?? undefined,
      });

      const resData = await queryRunner.manager.save(UserEntity, user);
      console.log('User created with ID:', resData);

      await queryRunner.commitTransaction();
      await this.cacheManager.del(redisKey);

      const tokens = await this.authService.generateTokens(user);
      return { message: 'Registration successful', userId: user.id, tokens };
    } catch (error) {
      console.log('Error during OTP verification:', error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ─── Role Management ────────────────────────────────────────────────────────

  async updateRole(
    targetUserId: string,
    newRole: UserRole,
    requestingUser: { id: string; role: UserRole; businessId: string | null },
  ) {
    const target = await this.userRepository.findOne({
      where: { id: targetUserId },
    });
    if (!target) throw new NotFoundException('User not found');

    // Cannot change ADMIN/SUPER_ADMIN role (only SUPER_ADMIN can do that)
    if (
      target.role === UserRole.ADMIN &&
      requestingUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Cannot change role of an admin');
    }

    // Cannot promote to ADMIN/SUPER_ADMIN unless you are SUPER_ADMIN
    if (
      (newRole === UserRole.ADMIN || newRole === UserRole.SUPER_ADMIN) &&
      requestingUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Cannot assign admin-level roles');
    }

    target.role = newRole;
    await this.userRepository.save(target);

    return { id: target.id, role: target.role };
  }

  // ─── Permission Management ───────────────────────────────────────────────────

  async updatePermissions(targetUserId: string, permissions: Permission[]) {
    const target = await this.userRepository.findOne({
      where: { id: targetUserId },
    });
    if (!target) throw new NotFoundException('User not found');

    target.customPermissions = permissions;
    await this.userRepository.save(target);

    const rolePerms = ROLE_PERMISSIONS[target.role] ?? [];
    const effective = Array.from(new Set([...rolePerms, ...permissions]));

    return {
      id: target.id,
      role: target.role,
      customPermissions: permissions,
      effectivePermissions: effective,
    };
  }

  async getRolePermissionsMap() {
    return Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => ({
      role,
      permissions: perms,
    }));
  }

  // ─── Invite User (Admin creates staff for their business) ────────────────────

  async inviteUser(
    dto: InviteUserDto,
    requestingUser: { id: string; role: UserRole; businessId: string | null },
  ) {
    const { email, name, mobile, password, role = UserRole.EMPLOYEE } = dto;

    // Prevent privilege escalation
    if (
      (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) &&
      requestingUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Cannot invite users with admin-level roles',
      );
    }

    const exists = await this.userRepository.findOne({ where: { email } });
    if (exists) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(password, 10);
    const referralCode = this.generateReferralCode();

    const user = this.userRepository.create({
      email,
      name,
      mobile: mobile ?? undefined,
      password: hashedPassword,
      role,
      isVerified: true,
      referralCode,
      businessId: requestingUser.businessId,
    });

    await this.userRepository.save(user);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessId: user.businessId,
    };
  }

  // ─── Soft Delete ────────────────────────────────────────────────────────────

  async softDelete(targetUserId: string) {
    const target = await this.userRepository.findOne({
      where: { id: targetUserId },
    });
    if (!target) throw new NotFoundException('User not found');

    target.isDeleted = true;
    await this.userRepository.save(target);
    return { message: 'User removed successfully' };
  }

  // ─── Profile Update ─────────────────────────────────────────────────────────

  async updateProfile(
    userRequest: { id: string },
    updateUserDto: UpdateUserDto,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userRequest.id },
    });
    if (!user) throw new NotFoundException('User not found');

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const exists = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (exists) throw new ConflictException('Email already in use');
      user.email = updateUserDto.email;
    }

    if (updateUserDto.address) user.address = updateUserDto.address;

    if (updateUserDto.mobile) {
      const exists = await this.userRepository.findOne({
        where: { mobile: updateUserDto.mobile },
      });
      if (exists) throw new ConflictException('Mobile already in use');
      user.mobile = updateUserDto.mobile;
    }

    if (updateUserDto.password) user.password = updateUserDto.password;

    return this.userRepository.save(user);
  }

  private generateReferralCode(): string {
    const part = uuidv4().replace(/-/g, '').substring(0, 6).toUpperCase();
    return `REF${part}`;
  }
}
