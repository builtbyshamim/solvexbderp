import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum } from 'class-validator';
import { Permission } from 'src/common/shared/enums/user-role.enum';

export class UpdatePermissionsDto {
  @ApiProperty({
    type: [String],
    enum: Permission,
    description: 'Full list of custom permissions to assign to the user',
  })
  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];
}
