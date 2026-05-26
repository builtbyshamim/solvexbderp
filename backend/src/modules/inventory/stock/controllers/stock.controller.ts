import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StockService } from '../services/stock.service';
import { CreateAdjustmentDto, CreateTransferDto, GetStockLedgerDto } from '../dto/stock.dto';
import { BusinessId } from 'src/common/decorators/business-id.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserEntity } from 'src/modules/users/entities/user.entity';

@ApiTags('Inventory - Stock')
@Controller({ path: 'inventory/stock', version: '1' })
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('adjustments')
  @ApiOperation({ summary: 'Create stock adjustment' })
  createAdjustment(
    @BusinessId() businessId: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateAdjustmentDto,
  ) {
    return this.stockService.createAdjustment(businessId, user.id, dto);
  }

  @Get('adjustments')
  @ApiOperation({ summary: 'Get all adjustments' })
  getAdjustments(
    @BusinessId() businessId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.stockService.getAdjustments(businessId, page, limit);
  }

  @Post('transfers')
  @ApiOperation({ summary: 'Create stock transfer' })
  createTransfer(
    @BusinessId() businessId: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateTransferDto,
  ) {
    return this.stockService.createTransfer(businessId, user.id, dto);
  }

  @Get('transfers')
  @ApiOperation({ summary: 'Get all transfers' })
  getTransfers(
    @BusinessId() businessId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.stockService.getTransfers(businessId, page, limit);
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

  @Get('ledger')
  @ApiOperation({ summary: 'Get stock ledger (immutable transaction history)' })
  getLedger(@BusinessId() businessId: string, @Query() query: GetStockLedgerDto) {
    return this.stockService.getLedger(businessId, query);
  }
}
