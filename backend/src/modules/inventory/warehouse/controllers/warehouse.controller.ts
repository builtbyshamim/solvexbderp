import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WarehouseService } from '../services/warehouse.service';
import { CreateWarehouseDto, GetWarehousesDto, UpdateWarehouseDto } from '../dto/warehouse.dto';
import { BusinessId } from 'src/common/decorators/business-id.decorator';

@ApiTags('Inventory - Warehouses')
@Controller({ path: 'inventory/warehouses', version: '1' })
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new warehouse' })
  create(@BusinessId() businessId: string, @Body() dto: CreateWarehouseDto) {
    return this.warehouseService.create(businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all warehouses' })
  findAll(@BusinessId() businessId: string, @Query() query: GetWarehousesDto) {
    return this.warehouseService.findAll(businessId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get warehouse by ID' })
  findOne(@BusinessId() businessId: string, @Param('id') id: string) {
    return this.warehouseService.findOne(businessId, id);
  }

  @Patch(':id/set-default')
  @ApiOperation({ summary: 'Set warehouse as default' })
  setDefault(@BusinessId() businessId: string, @Param('id') id: string) {
    return this.warehouseService.setDefault(businessId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a warehouse' })
  update(@BusinessId() businessId: string, @Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehouseService.update(businessId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a warehouse' })
  remove(@BusinessId() businessId: string, @Param('id') id: string) {
    return this.warehouseService.remove(businessId, id);
  }
}
