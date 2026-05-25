// src/modules/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../shared/enums/user-role.enum';

// Key to store roles metadata
export const ROLES_KEY = 'roles';

/**
 * Roles decorator
 * Usage:
 *  @Roles('admin', 'customer')
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
