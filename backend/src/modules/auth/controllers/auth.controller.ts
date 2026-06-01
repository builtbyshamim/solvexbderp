import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { PublicRoute } from 'src/common/decorators/public.decorator';
import type { Request } from 'express';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { SendMobileOtpDto, VerifyMobileOtpDto, MobileRegisterDto } from '../dto/mobile-auth.dto';

@ApiTags('auth') // Swagger tag for grouping authentication routes
@Controller('auth') // Base route for all auth endpoints: /auth
export class AuthController {
  constructor(private readonly authService: AuthService) { } // Inject AuthService to delegate auth logic

  /**
   * POST /auth/login
   * Public route for logging in with email and password.
   * Accepts a LoginDto { email, password }.
   * Returns JWT tokens and user info.
   */
  @PublicRoute() // Marks this route as accessible without authentication
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' }) // Swagger description
  async login(@Req() req: Request, @Body() loginDto: LoginDto) {
    // Delegate login logic to AuthService
    return this.authService.login(req, loginDto.email, loginDto.password);
  }

  @PublicRoute() // Marks this route as accessible without authentication
  @Post('admin-login')
  @ApiOperation({ summary: 'Login with email and password' }) // Swagger description
  async adminLogin(@Req() req: Request, @Body() loginDto: LoginDto) {
    // Delegate login logic to AuthService
    return this.authService.adminLogin(req, loginDto.email, loginDto.password);
  }

  /**
   * POST /auth/refresh
   * Route to refresh JWT tokens using a refresh token.
   * Accepts RefreshTokenDto { refreshToken }.
   * Returns new access and refresh tokens if refresh token is valid.
   */
  @PublicRoute()
  @Post('refresh')
  @ApiOperation({ summary: 'Get a new access token using refresh token' })
  async refresh(@Req() req: Request, @Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(req, refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(
    @CurrentUser() user: UserEntity,
    @Body() body: RefreshTokenDto,
  ) {
    return this.authService.logout(user.id, body.refreshToken);
  }

  @PublicRoute()
  @Post('forgot-password')
  async forgot(@Req() req: Request, @Body() dto: ForgotPasswordDto) {
    return this.authService.sendForgotPasswordOtp(req, dto.email);
  }


  @PublicRoute()
  @Post('verify-otp')
  async verify(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.code);
  }

  @PublicRoute()
  @Post('reset-password')
  async reset(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @PublicRoute()
  @Post('mobile/send-otp')
  @ApiOperation({ summary: 'Send OTP to mobile number' })
  async mobileSendOtp(@Body() dto: SendMobileOtpDto) {
    return this.authService.sendMobileOtp(dto.mobile);
  }

  @PublicRoute()
  @Post('mobile/verify-otp')
  @ApiOperation({ summary: 'Verify mobile OTP — returns tokens (existing user) or tempToken (new user)' })
  async mobileVerifyOtp(@Body() dto: VerifyMobileOtpDto) {
    return this.authService.verifyMobileOtp(dto.mobile, dto.code);
  }

  @PublicRoute()
  @Post('mobile/register')
  @ApiOperation({ summary: 'Complete mobile registration with name and password' })
  async mobileRegister(@Body() dto: MobileRegisterDto) {
    return this.authService.mobileRegister(dto.tempToken, dto.name, dto.password);
  }
}
