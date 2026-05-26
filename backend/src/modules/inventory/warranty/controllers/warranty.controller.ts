import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WarrantyService } from '../services/warranty.service';
import { CreateWarrantyDto, GetWarrantiesDto, UpdateWarrantyDto } from '../dto/warranty.dto';
import { BusinessId } from 'src/common/decorators/business-id.decorator';

@ApiTags('Inventory - Warranties')
@Controller({ path: 'inventory/warranties', version: '1' })
export class WarrantyController {
  constructor(private readonly warrantyService: WarrantyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new warranty' })
  create(@BusinessId() businessId: string, @Body() dto: CreateWarrantyDto) {
    return this.warrantyService.create(businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all warranties' })
  findAll(@BusinessId() businessId: string, @Query() query: GetWarrantiesDto) {
    return this.warrantyService.findAll(businessId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get warranty by ID' })
  findOne(@BusinessId() businessId: string, @Param('id') id: string) {
    return this.warrantyService.findOne(businessId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a warranty' })
  update(@BusinessId() businessId: string, @Param('id') id: string, @Body() dto: UpdateWarrantyDto) {
    return this.warrantyService.update(businessId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a warranty' })
  remove(@BusinessId() businessId: string, @Param('id') id: string) {
    return this.warrantyService.remove(businessId, id);
  }
}
