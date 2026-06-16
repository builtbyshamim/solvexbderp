import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { UserEntity } from '../entities/user.entity';
import { RegisterUserDto } from '../dto/create-user.dto';
import { PublicRoute } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/shared/enums/user-role.enum';
import { GetAllUsersDto } from '../dto/get-all-users.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { UpdatePermissionsDto } from '../dto/update-permissions.dto';
import { InviteUserDto } from '../dto/invite-user.dto';

export interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    businessId: string | null;
    customPermissions: string[];
  };
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Public Registration ──────────────────────────────────────────────────

  @Post('register')
  @PublicRoute()
  @ApiOperation({ summary: 'Initiate registration (sends OTP)' })
  @ApiResponse({ status: 201, type: UserEntity })
  create(@Body() registerUserDto: RegisterUserDto) {
    return this.usersService.initiateRegistration(registerUserDto);
  }

  @Post('verify-otp')
  @PublicRoute()
  @ApiOperation({ summary: 'Verify OTP and create account' })
  verifyOtp(@Body() otpDto: { email: string; otp: string }) {
    return this.usersService.verifyOtp(otpDto.email, otpDto.otp);
  }

  // ─── Role & Permission Reference ─────────────────────────────────────────

  @Get('permissions/roles')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get default permissions for each role' })
  getRolePermissions() {
    return this.usersService.getRolePermissionsMap();
  }

  // ─── User Listing ─────────────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all users (Admin/Manager only)' })
  @ApiResponse({ status: 200, description: 'Paginated list of users' })
  findAll(@Query() query: GetAllUsersDto) {
    return this.usersService.findAll(query);
  }

  // ─── Current User Profile ────────────────────────────────────────────────

  @Get('profile')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get logged-in user profile with permissions' })
  async getProfile(@CurrentUser() user: UserEntity) {
    return this.usersService.findOneWithPermissions(user.id);
  }

  // ─── Get Single User (must come after named routes like /profile, /permissions/roles) ──

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get user by ID with effective permissions' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOneWithPermissions(id);
  }

  // ─── Invite / Create Staff User ───────────────────────────────────────────

  @Post('invite')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Invite a new staff member to the business' })
  inviteUser(
    @Body() dto: InviteUserDto,
    @CurrentUser() user: UserEntity & { businessId: string | null; role: UserRole },
  ) {
    return this.usersService.inviteUser(dto, {
      id: user.id,
      role: user.role,
      businessId: (user as any).businessId ?? null,
    });
  }

  // ─── Role Update ─────────────────────────────────────────────────────────

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Change a user\'s role' })
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: UserEntity & { role: UserRole; businessId: string | null },
  ) {
    return this.usersService.updateRole(id, dto.role, {
      id: user.id,
      role: user.role,
      businessId: (user as any).businessId ?? null,
    });
  }

  // ─── Permission Update ────────────────────────────────────────────────────

  @Patch(':id/permissions')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Set custom permission overrides for a user' })
  updatePermissions(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionsDto,
  ) {
    return this.usersService.updatePermissions(id, dto.permissions);
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove a user (soft delete)' })
  remove(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }
}
