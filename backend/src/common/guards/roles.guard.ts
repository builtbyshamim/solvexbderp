import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../shared/enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) throw new ForbiddenException('Access denied');

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator → admin-only by default
    if (!requiredRoles || requiredRoles.length === 0) {
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Admin access only');
      }
      return true;
    }

    // ADMIN and SUPER_ADMIN always have access
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    if (!requiredRoles.includes(user.role as UserRole)) {
      throw new ForbiddenException('You do not have permission for this action');
    }

    return true;
  }
}
