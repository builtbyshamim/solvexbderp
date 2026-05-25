import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
    private readonly jwtService: JwtService, // JWT service for signing and verifying tokens
    private readonly configService: ConfigService, // Config service for env variables
    private readonly dataSource: DataSource, // TypeORM data source for transactions
  ) {}

  /**
   * Validates user credentials
   * @param email - User's email
   * @param password - User's plain text password
   * @returns UserEntity if valid
   * @throws UnauthorizedException if credentials are invalid
   */
  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  /**
   * Generates access and refresh JWT tokens for a user
   * @param user - User entity
   * @returns object containing accessToken and refreshToken
   */
  public async generateTokens(user: UserEntity) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const secret = this.configService.get<string>('jwt.secret');
    const issuer = this.configService.get<string>('jwt.issuer');
    const audience = this.configService.get<string>('jwt.audience');

    // Create access token
    const accessToken = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn: this.configService.get<number>('jwt.accessTokenTtl'),
      issuer,
      audience,
    });

    // Create refresh token
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn: this.configService.get<number>('jwt.refreshTokenTtl'),
      issuer,
      audience,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Handles login via email/password
   * @returns JWT tokens and user info
   */
  async login(req: Request, email: string, password: string) {
    const user = await this.validateUser(email, password);
    const tokens = await this.generateTokens(user);
    const refreshTokenHash = this.hashToken(tokens.refreshToken);
    const userAgent = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);
    const ua = parser.getResult();
    const ip_address = getIpAddress(req);
    const deviceInfo = {
      os: ua.os.name || 'Unknown',
      device_name: ua.ua || 'Unknown Device',
    };
    const refreshTokenTTL = Number(process.env.JWT_REFRESH_TOKEN_TTL);
    await this.dataSource.getRepository(RefreshTokenEntity).save({
      token: refreshTokenHash,
      user,
      ip: String(ip_address),
      device: String(deviceInfo.os + ' - ' + deviceInfo.device_name),
      userAgent: req.headers['user-agent'] || 'unknown',
      expiresAt: new Date(Date.now() + refreshTokenTTL * 1000),
    });
    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }
  async adminLogin(req: Request, email: string, password: string) {
    const user = await this.validateUser(email, password);
    const tokens = await this.generateTokens(user);
    const refreshTokenHash = this.hashToken(tokens.refreshToken);
    const userAgent = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);
    const ua = parser.getResult();
    const ip_address = getIpAddress(req);
    const deviceInfo = {
      os: ua.os.name || 'Unknown',
      device_name: ua.ua || 'Unknown Device',
    };
    const refreshTokenTTL = Number(process.env.JWT_REFRESH_TOKEN_TTL);
    await this.dataSource.getRepository(RefreshTokenEntity).save({
      token: refreshTokenHash,
      user,
      ip: String(ip_address),
      device: String(deviceInfo.os + ' - ' + deviceInfo.device_name),
      userAgent: req.headers['user-agent'] || 'unknown',
      expiresAt: new Date(Date.now() + refreshTokenTTL * 1000),
    });
    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }
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

    const tokenRecord = await this.dataSource
      .getRepository(RefreshTokenEntity)
      .findOne({
        where: {
          token: tokenHash,
          isRevoked: false,
        },
        relations: ['user'],
      });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token invalid');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }
    const ip_address = getIpAddress(req);
    // 🕒 update last used
    tokenRecord.lastUsedAt = new Date();
    tokenRecord.ip = String(ip_address);

    await this.dataSource.getRepository(RefreshTokenEntity).save(tokenRecord);

    return this.generateTokens(user);
  }
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendForgotPasswordOtp(req: Request, email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return { status: true };
    // don't reveal user existence

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
                  font-size:32px;
                  font-weight:700;
                  letter-spacing:8px;
                  background:linear-gradient(135deg,#f8fafc,#eef2f7);
                  padding:18px;
                  text-align:center;
                  border-radius:8px;
                  margin:25px 0;
                  border:1px dashed #cbd5e1;
                ">
                  ${otp}
                </div>

                <p style="margin:0;font-size:14px;">
                  ⏳ This code will expire in 
                  <strong style="color:#dc2626;">5 minutes</strong>
                </p>

                <p style="margin-top:20px;font-size:14px;color:#555;">
                  For your security, never share this code with anyone.
                </p>
              `;

    const content = baseEmailTemplate(otpContact);

    const mailContent = {
      to: email,
      subject: 'Your Password Reset OTP',
      html: content,
      text: `Your OTP for password reset is: ${otp}`,
    };
    await this.mailService.sendMail(mailContent);

    return { status: true };
  }

  async verifyOtp(email: string, code: string) {
    const otpRow = await this.otpRepo.findOne({
      where: {
        email,
        purpose: 'forgot_password',
        used: false,
      },
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

    // short lived reset token (5 min)
    const resetToken = this.jwtService.sign(
      { email, scope: 'reset' },
      { expiresIn: '5m' },
    );

    return { status: true, resetToken };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let payload;
    const { resetToken, newPassword } = dto;

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

    user.password = await bcrypt.hash(newPassword, 12);
    await this.userRepository.save(user);

    // revoke sessions
    await this.refreshTokenRepo.delete({ user: { id: user.id } });

    return { status: true };
  }

  // common class

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
