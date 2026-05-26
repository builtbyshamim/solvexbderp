import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { UserEntity } from '../entities/user.entity';
import { RegisterUserDto } from '../dto/create-user.dto';
import { PublicRoute } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/shared/enums/user-role.enum';
import { GetAllUsersDto } from '../dto/get-all-users.dto';
export interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

@ApiTags('Users')
@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(
    private readonly usersService: UsersService
  ) { }
  // Create user
  @Post('register')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserEntity,
  })
  @PublicRoute()
  create(@Body() registerUserDto: RegisterUserDto) {
    return this.usersService.initiateRegistration(registerUserDto);
  }




  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP' })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    type: UserEntity,
  })
  @PublicRoute()
  verifyOtp(@Body() otpDto: { email: string; otp: string }) {
    return this.usersService.verifyOtp(otpDto.email, otpDto.otp);
  }



  // // Get all users
  // @Get()
  // @ApiOperation({ summary: 'Get all users' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'List of users',
  //   type: [UserEntity],
  // })
  // findAll() {
  //   return this.usersService.findAll();
  // }

  // // Get single user
  // @Get(':id')
  // @ApiOperation({ summary: 'Get user by ID' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'User found',
  //   type: UserEntity,
  // })
  // findOne(@Param('id') id: string) {
  //   return this.usersService.findOne(id);
  // }

  // // Update user
  // @Patch(':id')
  // @ApiOperation({ summary: 'Update user by ID' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'User updated successfully',
  // })
  // update(
  //   @Param('id') id: string,
  //   @Body() updateUserDto: Partial<RegisterUserDto>,
  // ) {
  //   return this.usersService.update(id, updateUserDto);
  // }

  // // Delete user (soft delete later)
  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete user by ID' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'User deleted successfully',
  // })
  // remove(@Param('id') id: string) {
  //   return this.usersService.remove(id);
  // }

  /**
 * GET /v1/users
 * Query params: page, limit, search, sortBy, sortOrder, role
 * Protected: ADMIN only
 */
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated list of users' })
  findAll(@Query() query: GetAllUsersDto) {
    return this.usersService.findAll(query);
  }

  /**
   * GET /users/profile
   * Get logged-in user's profile (fetched fresh from DB)
   */
  @Get('profile')
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get logged-in user profile' })
  @ApiResponse({ status: 200, description: 'Return user profile' })
  async getProfile(@CurrentUser() user: UserEntity) {
    const fresh = await this.usersService.findById(user.id);
    if (!fresh) return null;
    return {
      id: fresh.id,
      email: fresh.email,
      name: fresh.name,
      mobile: fresh.mobile,
      avatar: fresh.avatar,
      role: fresh.role,
      isVerified: fresh.isVerified,
    };
  }
}
