import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from 'src/common/shared/enums/user-role.enum';

export class RegisterUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  referralId?: string;

  @ApiProperty()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole })
  @IsOptional()
  role?: UserRole;
}
