import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UserRole } from '../shared/enums/user-role.enum';
import { BusinessEntity } from 'src/modules/business/entities/business.entity';

// Paths that are always accessible regardless of subscription status.
// Compared against the request URL path after /api/v1/ prefix.
const WHITELIST_PATHS = [
  '/api/v1/users/profile',
  '/api/v1/packages/public',
  '/api/v1/packages',
  '/api/v1/business/me',
  '/api/v1/business/setup',
  '/api/v1/business/subscribe',
  '/api/v1/business/subscription/renew',
  '/api/v1/auth/',
];

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return true; // JwtAuthGuard will handle unauthenticated

    // Super admin is never subscription-gated
    if (user.role === UserRole.SUPER_ADMIN) return true;

    // Whitelist check
    const path: string = request.path ?? '';
    if (WHITELIST_PATHS.some((p) => path.startsWith(p))) return true;

    const businessId: string | null = user.businessId ?? null;
    if (!businessId) return true; // no business yet → let other guards handle

    const business = await this.dataSource
      .getRepository(BusinessEntity)
      .findOne({ where: { id: businessId }, select: ['id', 'isActive', 'subscriptionStatus', 'subscriptionExpiresAt'] });

    if (!business) return true;

    if (!business.isActive) {
      throw new HttpException(
        { message: 'Account suspended. Contact support.', code: 'ACCOUNT_SUSPENDED' },
        HttpStatus.FORBIDDEN,
      );
    }

    if (business.subscriptionExpiresAt === null) return true; // unlimited

    const isExpired = business.subscriptionExpiresAt <= new Date();
    if (isExpired) {
      throw new HttpException(
        { message: 'Subscription expired. Please renew to continue.', code: 'SUBSCRIPTION_EXPIRED' },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true;
  }
}
