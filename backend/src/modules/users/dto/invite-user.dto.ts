import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from 'src/common/shared/enums/user-role.enum';

export class InviteUserDto {
  @ApiProperty({ example: 'staff@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: '01700000000' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ example: 'Secure@123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.EMPLOYEE })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
