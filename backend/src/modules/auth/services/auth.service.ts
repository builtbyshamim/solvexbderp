import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from 'src/common/shared/interfaces/jwt-payload.interface';
import * as crypto from 'crypto';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { UAParser } from 'ua-parser-js';
import { Request } from 'express';
import { getIpAddress } from 'src/utilits/common';
import * as bcrypt from 'bcrypt';
import { OtpEntity } from '../entities/auth-otp.entity';
import { MailService } from 'src/modules/mail/mail.service';
import { baseEmailTemplate } from 'src/utilits/email-template-builder/base-email-template';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UserRole } from 'src/common/shared/enums/user-role.enum';
import { BusinessEntity } from 'src/modules/business/entities/business.entity';
import { AccountEntity, AccountType } from 'src/modules/accounting/entities/account.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(OtpEntity)
    private readonly otpRepo: Repository<OtpEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepo: Repository<RefreshTokenEntity>,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private createQueryRunner(): QueryRunner {
    return this.dataSource.createQueryRunner();
  }

  private buildDeviceInfo(req: Request) {
    const ua = new UAParser(req.headers['user-agent'] || '').getResult();
    return {
      ip: String(getIpAddress(req)),
      device: `${ua.os.name ?? 'Unknown'} - ${ua.ua ?? 'Unknown Device'}`,
      userAgent: req.headers['user-agent'] || 'unknown',
    };
  }

  private refreshTokenTTL(): number {
    return Number(process.env.JWT_REFRESH_TOKEN_TTL || 604800);
  }

  // ─── Token generation ────────────────────────────────────────────────────────

  public async generateTokens(user: UserEntity, businessId?: string) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      businessId: businessId ?? undefined,
    };

    const secret = this.configService.get<string>('jwt.secret');
    const issuer = this.configService.get<string>('jwt.issuer');
    const audience = this.configService.get<string>('jwt.audience');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret,
        expiresIn: this.configService.get<number>('jwt.accessTokenTtl'),
        issuer,
        audience,
      }),
      this.jwtService.signAsync(payload, {
        secret,
        expiresIn: this.configService.get<number>('jwt.refreshTokenTtl'),
        issuer,
        audience,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // ─── Validate credentials ────────────────────────────────────────────────────

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  // ─── Login (User + RefreshToken) ─────────────────────────────────────────────

  async login(req: Request, email: string, password: string) {
    const user = await this.validateUser(email, password);
    const tokens = await this.generateTokens(user);
    const { ip, device, userAgent } = this.buildDeviceInfo(req);

    const qr = this.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      await qr.manager.save(RefreshTokenEntity, {
        token: this.hashToken(tokens.refreshToken),
        user,
        ip,
        device,
        userAgent,
        expiresAt: new Date(Date.now() + this.refreshTokenTTL() * 1000),
      });
      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }

    return {
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  // ─── Admin Login (User + RefreshToken) ───────────────────────────────────────

  async adminLogin(req: Request, email: string, password: string) {
    const user = await this.validateUser(email, password);

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new ForbiddenException('Access denied. Admin accounts only.');
    }

    const tokens = await this.generateTokens(user);
    const { ip, device, userAgent } = this.buildDeviceInfo(req);

    const qr = this.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      await qr.manager.save(RefreshTokenEntity, {
        token: this.hashToken(tokens.refreshToken),
        user,
        ip,
        device,
        userAgent,
        expiresAt: new Date(Date.now() + this.refreshTokenTTL() * 1000),
      });
      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }

    return {
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────

  async logout(userId: string, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.refreshTokenRepo.update(
      { token: tokenHash, user: { id: userId } },
      { isRevoked: true },
    );
    return { message: 'Logged out successfully' };
  }

  // ─── Refresh Tokens (RefreshToken read + update) ──────────────────────────────

  async refreshTokens(req: Request, refreshToken: string) {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(
      refreshToken,
      {
        secret: this.configService.get<string>('jwt.secret'),
        issuer: this.configService.get<string>('jwt.issuer'),
        audience: this.configService.get<string>('jwt.audience'),
      },
    );

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException('Invalid refresh token');

    const tokenHash = this.hashToken(refreshToken);

    const qr = this.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const tokenRecord = await qr.manager.findOne(RefreshTokenEntity, {
        where: { token: tokenHash, isRevoked: false },
        relations: ['user'],
      });

      if (!tokenRecord)
        throw new UnauthorizedException('Refresh token invalid');
      if (tokenRecord.expiresAt < new Date())
        throw new UnauthorizedException('Refresh token expired');

      tokenRecord.lastUsedAt = new Date();
      tokenRecord.ip = String(getIpAddress(req));
      await qr.manager.save(RefreshTokenEntity, tokenRecord);

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }

    return this.generateTokens(user);
  }

  // ─── Forgot Password OTP ─────────────────────────────────────────────────────

  async sendForgotPasswordOtp(req: Request, email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return { status: true }; // don't reveal user existence

    const otp = this.generateOtp();
    const codeHash = await bcrypt.hash(otp, 10);

    await this.otpRepo.delete({
      email,
      purpose: 'forgot_password',
      used: false,
    });
    await this.otpRepo.save({
      email,
      codeHash: String(codeHash),
      purpose: 'forgot_password',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      ipAddress: req.ip,
    });

    const otpContact = `
      <h2 style="margin:0 0 10px 0;">🔐 Password Reset Verification</h2>
      <p style="font-size:15px;">
        We received a request to reset your password.
        Use the verification code below to continue:
      </p>
      <div style="
        font-size:32px;font-weight:700;letter-spacing:8px;
        background:linear-gradient(135deg,#f8fafc,#eef2f7);
        padding:18px;text-align:center;border-radius:8px;
        margin:25px 0;border:1px dashed #cbd5e1;">
        ${otp}
      </div>
      <p style="margin:0;font-size:14px;">
        ⏳ This code will expire in <strong style="color:#dc2626;">5 minutes</strong>
      </p>
      <p style="margin-top:20px;font-size:14px;color:#555;">
        For your security, never share this code with anyone.
      </p>`;

    await this.mailService.sendMail({
      to: email,
      subject: 'Your Password Reset OTP',
      html: baseEmailTemplate(otpContact),
      text: `Your OTP for password reset is: ${otp}`,
    });

    return { status: true };
  }

  // ─── Verify OTP ──────────────────────────────────────────────────────────────

  async verifyOtp(email: string, code: string) {
    const otpRow = await this.otpRepo.findOne({
      where: { email, purpose: 'forgot_password', used: false },
      order: { createdAt: 'DESC' },
    });

    if (!otpRow) throw new BadRequestException('Invalid OTP');
    if (otpRow.expiresAt < new Date())
      throw new BadRequestException('OTP expired');
    if (otpRow.attempts >= 5)
      throw new BadRequestException('Too many attempts');

    const match = await bcrypt.compare(code, otpRow.codeHash);
    if (!match) {
      otpRow.attempts += 1;
      await this.otpRepo.save(otpRow);
      throw new BadRequestException('Invalid OTP');
    }

    const resetToken = this.jwtService.sign(
      { email, scope: 'reset' },
      { expiresIn: '5m' },
    );

    return { status: true, resetToken };
  }

  // ─── Reset Password (User + RefreshToken) ────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    const { resetToken, newPassword } = dto;
    let payload: any;

    try {
      payload = this.jwtService.verify(resetToken);
    } catch {
      throw new BadRequestException('Invalid token');
    }

    if (payload.scope !== 'reset')
      throw new BadRequestException('Invalid token');

    const user = await this.userRepository.findOne({
      where: { email: payload.email },
    });
    if (!user) throw new BadRequestException('User not found');

    const qr = this.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      user.password = await bcrypt.hash(newPassword, 12);
      await qr.manager.save(UserEntity, user);
      await qr.manager.delete(RefreshTokenEntity, { user: { id: user.id } });
      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }

    return { status: true };
  }

  // ─── Send Mobile OTP ─────────────────────────────────────────────────────────

  async sendMobileOtp(mobile: string) {
    const normalizedMobile = mobile.trim();
    await this.otpRepo.delete({
      email: normalizedMobile,
      purpose: 'login',
      used: false,
    });

    const otp = '123456'; // fixed OTP for development
    const codeHash = await bcrypt.hash(otp, 10);

    await this.otpRepo.save({
      email: normalizedMobile,
      codeHash,
      purpose: 'login',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    return { message: 'OTP sent successfully' };
  }

  // ─── Verify Mobile OTP (OtpEntity + UserEntity + BusinessEntity + RefreshTokenEntity) ──

  async verifyMobileOtp(mobile: string, code: string) {
    const normalizedMobile = mobile.trim();
    const otpRow = await this.otpRepo.findOne({
      where: { email: normalizedMobile, purpose: 'login', used: false },
      order: { createdAt: 'DESC' },
    });

    if (!otpRow)
      throw new BadRequestException('Invalid OTP. Please request a new one.');
    if (otpRow.expiresAt < new Date())
      throw new BadRequestException('OTP expired');
    if (otpRow.attempts >= 5)
      throw new BadRequestException('Too many attempts');

    const match = await bcrypt.compare(code, otpRow.codeHash);
    if (!match) {
      otpRow.attempts += 1;
      await this.otpRepo.save(otpRow);
      throw new BadRequestException('Invalid OTP');
    }

    // Mark OTP used — single entity, no transaction needed
    otpRow.used = true;
    await this.otpRepo.save(otpRow);

    const user = await this.userRepository.findOne({
      where: { mobile: normalizedMobile },
    });
    if (user) {
      // Existing user: read Business + persist RefreshToken atomically
      const qr = this.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();
      try {
        const business = await qr.manager.findOne(BusinessEntity, {
          where: { ownerId: user.id },
        });

        const tokens = await this.generateTokens(user, business?.id);

        await qr.manager.save(RefreshTokenEntity, {
          token: this.hashToken(tokens.refreshToken),
          user,
          ip: 'mobile',
          device: 'Mobile Auth',
          userAgent: 'mobile-otp',
          expiresAt: new Date(Date.now() + this.refreshTokenTTL() * 1000),
        });

        await qr.commitTransaction();

        return {
          isNewUser: false,
          user: { id: user.id, name: user.name, role: user.role },
          ...tokens,
        };
      } catch (err) {
        console.log('Error during mobile OTP login transaction:', err);
        await qr.rollbackTransaction();
        throw new InternalServerErrorException('Failed to complete login');
      } finally {
        await qr.release();
      }
    }

    // New user: issue temp registration token
    const tempToken = this.jwtService.sign(
      { mobile: normalizedMobile, scope: 'mobile_register' },
      { expiresIn: '15m' },
    );

    return { isNewUser: true, tempToken };
  }

  // ─── Mobile Register (UserEntity + BusinessEntity + RefreshTokenEntity) ───────

  async mobileRegister(tempToken: string, name: string, password: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(tempToken);
    } catch {
      throw new BadRequestException('Invalid or expired registration token');
    }

    if (payload.scope !== 'mobile_register')
      throw new BadRequestException('Invalid token');

    const mobile = payload.mobile as string;

    const existing = await this.userRepository.findOne({ where: { mobile } });
    if (existing)
      throw new ConflictException('Account already exists. Please sign in.');

    const hashedPassword = await bcrypt.hash(password, 12);
    const emailPlaceholder = `m.${mobile}@bizcore.local`;

    const qr = this.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      // 1. Create user
      const user = qr.manager.create(UserEntity, {
        mobile,
        email: emailPlaceholder,
        name,
        password: hashedPassword,
        role: UserRole.ADMIN,
        isVerified: true,
      });
      const savedUser = await qr.manager.save(UserEntity, user);

      // 2. Create business (trial)
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 15);

      const business = qr.manager.create(BusinessEntity, {
        name: `${name}'s Business`,
        ownerId: savedUser.id,
        currencyCode: 'BDT',
        subscriptionStatus: 'trial',
        subscriptionExpiresAt: trialEnd,
        subscriptionPlan: null,
      });
      const savedBusiness = await qr.manager.save(BusinessEntity, business);

      // 3. Create default Petty Cash account for the business
      const pettyCash = qr.manager.create(AccountEntity, {
        name: 'Petty Cash',
        accountType: AccountType.CASH,
        openingBalance: 0,
        currentBalance: 0,
        isDefault: true,
        businessId: savedBusiness.id,
        isActive: true,
        description: 'Default petty cash account',
      });
      await qr.manager.save(AccountEntity, pettyCash);

      // 5. Generate tokens + persist RefreshToken
      const tokens = await this.generateTokens(savedUser, savedBusiness.id);

      await qr.manager.save(RefreshTokenEntity, {
        token: this.hashToken(tokens.refreshToken),
        user: savedUser,
        ip: 'mobile',
        device: 'Mobile Auth',
        userAgent: 'mobile-otp',
        expiresAt: new Date(Date.now() + this.refreshTokenTTL() * 1000),
      });

      await qr.commitTransaction();

      return {
        isNewUser: true,
        user: { id: savedUser.id, name: savedUser.name, role: savedUser.role },
        ...tokens,
      };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }
}
