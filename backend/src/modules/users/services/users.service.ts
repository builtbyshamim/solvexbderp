import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
  BadRequestException,
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
const OTP_TTL = 10 * 60 * 1000; // 10 min
const MAX_ATTEMPTS = 5;               // 5 বার wrong OTP → block
const MAX_RESEND = 3;               // 10 min এ max 3 বার resend
const RESEND_WINDOW = 10 * 60 * 1000; // resend window 10 min
import { v4 as uuidv4 } from 'uuid';
import { GetAllUsersDto } from '../dto/get-all-users.dto';

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
    private readonly userRepository: Repository<UserEntity>, // TypeORM repository for UserEntity
    private readonly authService: AuthService,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly mailService: MailService,
  ) { }

  // OTP hash করো (SHA-256 যথেষ্ট — short-lived token)
  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  // Constant-time comparison — timing attack প্রতিরোধ
  private safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  async initiateRegistration(dto: RegisterUserDto) {
    const { email, password, referralId, name } = dto;

    // Email exists check
    const exists = await this.userRepository.findOne({ where: { email } });
    if (exists) throw new ConflictException('Email already exists');

    // Referral check
    if (referralId) {
      const referrer = await this.userRepository.findOne({
        where: { referralCode: referralId },
      });
      if (!referrer) throw new BadRequestException('Invalid referral ID');
    }

    const redisKey = `pending_signup:${email}`;

    // Resend limit check
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

    // OTP generate + hash
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

  async verifyOtp(email: string, otp: string) {
    const redisKey = `pending_signup:${email}`;
    const data = await this.cacheManager.get<PendingSignup>(redisKey);
    // Generic error — email enumeration রোধ করে
    if (!data) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    // Brute force check
    if (data.attempts >= MAX_ATTEMPTS) {
      await this.cacheManager.del(redisKey); // block করো
      throw new BadRequestException(
        'Too many incorrect attempts. Please register again.',
      );
    }

    // OTP check (timing-safe)
    const inputHash = this.hashOtp(otp);
    const isValid = this.safeCompare(inputHash, data.otpHash);

    if (!isValid) {
      // Attempt count বাড়াও
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

    // ✅ OTP সঠিক — DB save (with race condition protection)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Double-check email still doesn't exist (race condition)
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
        referralId: data.referralId ?? undefined,
      });

      await queryRunner.manager.save(UserEntity, user);
      await queryRunner.commitTransaction();

      // Redis cleanup
      await this.cacheManager.del(redisKey);

      const tokens = await this.authService.generateTokens(user);
      return {
        message: 'Registration successful',
        userId: user.id,
        tokens,
      };
    } catch (error) {
      console.log(error, 'error')
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  /**
   * Find a user by email
   * @param email - Email to search
   * @returns UserEntity or null
   */
  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  private generateReferralCode(): string {
    const part = uuidv4().replace(/-/g, '').substring(0, 6).toUpperCase();
    return `REF${part}`;
  }
  /**
   * Find a user by ID
   * @param id - User ID
   * @returns UserEntity or null
   */
  async findById(id: string) {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * Update logged-in user's profile
   * Steps:
   * 1. Fetch the user from DB using ID from JWT
   * 2. Check if email is being updated and ensure it's unique
   * 3. Update first_name, last_name, address if provided
   * 4. Check if mobile number is updated and ensure uniqueness
   * 5. Update password if provided
   * 6. Save the updated user in the DB
   * @param userRequest - Object containing user ID from JWT
   * @param updateUserDto - DTO containing updated fields
   * @returns Updated UserEntity
   */
  async updateProfile(
    userRequest: { id: string },
    updateUserDto: UpdateUserDto,
  ) {
    // 1️ Fetch the user from DB
    const user = await this.userRepository.findOne({
      where: { id: userRequest.id },
    });
    if (!user) throw new NotFoundException('User not found');

    // 2️ Update email if provided and ensure it's unique
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const exists = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (exists) throw new ConflictException('Email already in use');
      user.email = updateUserDto.email;
    }

    // 4️ Update address if provided
    if (updateUserDto.address) {
      user.address = updateUserDto.address;
    }

    // 5️ Update mobile if provided and ensure uniqueness
    if (updateUserDto.mobile) {
      const exists = await this.userRepository.findOne({
        where: { mobile: updateUserDto.mobile },
      });
      if (exists) throw new ConflictException('Mobile already in use');
      user.mobile = updateUserDto.mobile;
    }

    // 6️ Update password if provided
    if (updateUserDto.password) {
      user.password = updateUserDto.password;
    }

    // Save the updated user to the database
    return this.userRepository.save(user);
  }
}
