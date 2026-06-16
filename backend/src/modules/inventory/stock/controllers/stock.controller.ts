import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StockService } from '../services/stock.service';
import { StockLocationService } from '../../warehouse/services/stock-location.service';
import {
  CreateAdjustmentDto,
  CreateTransferDto,
  GetAdjustmentsDto,
  GetStockLedgerDto,
  GetTransfersDto,
} from '../dto/stock.dto';
import { BusinessId } from 'src/common/decorators/business-id.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserEntity } from 'src/modules/users/entities/user.entity';

@ApiTags('Inventory - Stock')
@Controller({ path: 'inventory/stock', version: '1' })
export class StockController {
  constructor(
    private readonly stockService: StockService,
    private readonly locationService: StockLocationService,
  ) {}

  // ─── LOCATIONS ─────────────────────────────────────────────────────────────

  @Get('locations')
  @ApiOperation({ summary: 'Get all stock locations for this business' })
  getLocations(@BusinessId() businessId: string) {
    return this.locationService.findAllByBusiness(businessId);
  }

  // ─── ADJUSTMENTS ───────────────────────────────────────────────────────────

  @Post('adjustments')
  @ApiOperation({ summary: 'Create stock adjustment (warehouseId optional — defaults to business)' })
  createAdjustment(
    @BusinessId() businessId: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateAdjustmentDto,
  ) {
    return this.stockService.createAdjustment(businessId, user.id, dto);
  }

  @Get('adjustments')
  @ApiOperation({ summary: 'Get all adjustments' })
  getAdjustments(@BusinessId() businessId: string, @Query() query: GetAdjustmentsDto) {
    return this.stockService.getAdjustments(businessId, query);
  }

  // ─── TRANSFERS ─────────────────────────────────────────────────────────────

  @Post('transfers')
  @ApiOperation({ summary: 'Create stock transfer between locations' })
  createTransfer(
    @BusinessId() businessId: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateTransferDto,
  ) {
    return this.stockService.createTransfer(businessId, user.id, dto);
  }

  @Get('transfers')
  @ApiOperation({ summary: 'Get all transfers' })
  getTransfers(@BusinessId() businessId: string, @Query() query: GetTransfersDto) {
    return this.stockService.getTransfers(businessId, query);
  }

  @Patch('transfers/:id/approve')
  @ApiOperation({ summary: 'Approve a stock transfer' })
  approveTransfer(
    @BusinessId() businessId: string,
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
  ) {
    return this.stockService.approveTransfer(businessId, id, user.id);
  }

  @Patch('transfers/:id/cancel')
  @ApiOperation({ summary: 'Cancel a stock transfer' })
  cancelTransfer(@BusinessId() businessId: string, @Param('id') id: string) {
    return this.stockService.cancelTransfer(businessId, id);
  }

  // ─── LEDGER ────────────────────────────────────────────────────────────────

  @Get('ledger')
  @ApiOperation({ summary: 'Get stock ledger (immutable transaction history)' })
  getLedger(@BusinessId() businessId: string, @Query() query: GetStockLedgerDto) {
    return this.stockService.getLedger(businessId, query);
  }

  // ─── CURRENT STOCK ─────────────────────────────────────────────────────────

  @Get('current/:productId')
  @ApiOperation({ summary: 'Get current stock for a product across all locations' })
  getCurrentStock(
    @BusinessId() businessId: string,
    @Param('productId') productId: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.stockService.getCurrentStock(businessId, productId, locationId);
  }
}
