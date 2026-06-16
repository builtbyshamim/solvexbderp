import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, UserRole } from '../shared/enums/user-role.enum';
import { PERMISSIONS_KEY } from '../decorators/permission.decorator';
import { ROLE_PERMISSIONS } from '../config/role-permissions.config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Access denied');

    const role = user.role as UserRole;

    if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) return true;

    const rolePerms: Permission[] = ROLE_PERMISSIONS[role] ?? [];
    const customPerms: Permission[] = user.customPermissions ?? [];
    const effective = new Set([...rolePerms, ...customPerms]);

    if (!required.every((p) => effective.has(p))) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
