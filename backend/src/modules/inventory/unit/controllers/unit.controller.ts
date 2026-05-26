import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UnitService } from '../services/unit.service';
import { CreateUnitDto, GetUnitsDto, UpdateUnitDto } from '../dto/unit.dto';
import { BusinessId } from 'src/common/decorators/business-id.decorator';

@ApiTags('Inventory - Units')
@Controller({ path: 'inventory/units', version: '1' })
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new unit' })
  create(@BusinessId() businessId: string, @Body() dto: CreateUnitDto) {
    return this.unitService.create(businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all units' })
  findAll(@BusinessId() businessId: string, @Query() query: GetUnitsDto) {
    return this.unitService.findAll(businessId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get unit by ID' })
  findOne(@BusinessId() businessId: string, @Param('id') id: string) {
    return this.unitService.findOne(businessId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a unit' })
  update(
    @BusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUnitDto,
  ) {
    return this.unitService.update(businessId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a unit' })
  remove(@BusinessId() businessId: string, @Param('id') id: string) {
    return this.unitService.remove(businessId, id);
  }
}
