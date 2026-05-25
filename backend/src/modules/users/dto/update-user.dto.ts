import { PartialType } from '@nestjs/swagger';
import { RegisterUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(RegisterUserDto) {}
