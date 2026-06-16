import {
  Controller, Get, Post, Patch, Delete,
  Body, Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PackageService } from '../services/package.service';
import { CreatePackageDto, UpdatePackageDto } from '../dto/package.dto';
import { PublicRoute } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/shared/enums/user-role.enum';

@ApiTags('Packages')
@Controller({ path: 'packages', version: '1' })
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @PublicRoute()
  @Get('public')
  @ApiOperation({ summary: 'Get all active packages (public)' })
  getPublic() {
    return this.packageService.getPublic();
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all packages (super admin)' })
  getAll() {
    return this.packageService.getAll();
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a package (super admin)' })
  create(@Body() dto: CreatePackageDto) {
    return this.packageService.create(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a package (super admin)' })
  update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packageService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a package (super admin)' })
  remove(@Param('id') id: string) {
    return this.packageService.remove(id);
  }
}
