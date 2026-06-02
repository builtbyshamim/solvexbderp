import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PurchaseService } from '../services/purchase.service';
import {
  CreatePurchaseDto, CreateSupplierDto, GetPurchasesDto,
  GetSuppliersDto, UpdateSupplierDto,
} from '../dto/purchase.dto';
import { BusinessId } from 'src/common/decorators/business-id.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserEntity } from 'src/modules/users/entities/user.entity';

@ApiTags('Purchase')
@Controller({ path: 'purchase', version: '1' })
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  // ── Suppliers ──
  @Post('suppliers')
  @ApiOperation({ summary: 'Create supplier' })
  createSupplier(@BusinessId() biz: string, @Body() dto: CreateSupplierDto) {
    return this.purchaseService.createSupplier(biz, dto);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'Get all suppliers' })
  getSuppliers(@BusinessId() biz: string, @Query() q: GetSuppliersDto) {
    return this.purchaseService.findAllSuppliers(biz, q);
  }

  @Get('suppliers/:id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  getSupplier(@BusinessId() biz: string, @Param('id') id: string) {
    return this.purchaseService.findSupplier(biz, id);
  }

  @Patch('suppliers/:id')
  @ApiOperation({ summary: 'Update supplier' })
  updateSupplier(@BusinessId() biz: string, @Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.purchaseService.updateSupplier(biz, id, dto);
  }

  @Delete('suppliers/:id')
  @ApiOperation({ summary: 'Delete supplier' })
  deleteSupplier(@BusinessId() biz: string, @Param('id') id: string) {
    return this.purchaseService.deleteSupplier(biz, id);
  }

  // ── Purchases ──
  @Post()
  @ApiOperation({ summary: 'Create purchase order' })
  create(
    @BusinessId() biz: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: CreatePurchaseDto,
  ) {
    return this.purchaseService.createPurchase(biz, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all purchases' })
  findAll(@BusinessId() biz: string, @Query() q: GetPurchasesDto) {
    return this.purchaseService.findAllPurchases(biz, q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase by ID' })
  findOne(@BusinessId() biz: string, @Param('id') id: string) {
    return this.purchaseService.findPurchase(biz, id);
  }

  @Get('suppliers/:id/ledger')
  @ApiOperation({ summary: 'Get supplier ledger' })
  getSupplierLedger(
    @BusinessId() biz: string,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.purchaseService.getSupplierLedger(biz, id, { page, limit });
  }
}
