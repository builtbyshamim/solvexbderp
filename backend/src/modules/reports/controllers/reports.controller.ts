import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportsService } from '../services/reports.service';
import { BusinessId } from 'src/common/decorators/business-id.decorator';

@ApiTags('Reports')
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales-summary')
  @ApiOperation({ summary: 'Sales summary for a date range' })
  salesSummary(
    @BusinessId() biz: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getSalesSummary(biz, dateFrom, dateTo);
  }

  @Get('purchase-summary')
  @ApiOperation({ summary: 'Purchase summary for a date range' })
  purchaseSummary(
    @BusinessId() biz: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getPurchaseSummary(biz, dateFrom, dateTo);
  }

  @Get('sales-by-date')
  @ApiOperation({ summary: 'Daily sales breakdown' })
  salesByDate(
    @BusinessId() biz: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getSalesByDate(biz, dateFrom, dateTo);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Top selling products by revenue' })
  topProducts(
    @BusinessId() biz: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getTopProducts(biz, dateFrom, dateTo, limit ? Number(limit) : 10);
  }

  @Get('top-customers')
  @ApiOperation({ summary: 'Top customers by spend' })
  topCustomers(
    @BusinessId() biz: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getTopCustomers(biz, dateFrom, dateTo, limit ? Number(limit) : 20);
  }

  @Get('top-suppliers')
  @ApiOperation({ summary: 'Top suppliers by purchase volume' })
  topSuppliers(
    @BusinessId() biz: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getTopSuppliers(biz, dateFrom, dateTo, limit ? Number(limit) : 20);
  }

  @Get('stock-valuation')
  @ApiOperation({ summary: 'Total stock value at cost' })
  stockValuation(@BusinessId() biz: string) {
    return this.reportsService.getStockValuation(biz);
  }

  @Get('profit-loss')
  @ApiOperation({ summary: 'P&L statement for a date range' })
  profitLoss(
    @BusinessId() biz: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getProfitLoss(biz, dateFrom, dateTo);
  }

  @Get('category-sales')
  @ApiOperation({ summary: 'Sales revenue breakdown by product category' })
  categorySales(
    @BusinessId() biz: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getCategorySales(biz, dateFrom, dateTo);
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'Sales breakdown by payment method' })
  paymentMethods(
    @BusinessId() biz: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getPaymentMethodBreakdown(biz, dateFrom, dateTo);
  }

  @Get('receivables')
  @ApiOperation({ summary: 'Customer receivables (outstanding dues)' })
  receivables(@BusinessId() biz: string) {
    return this.reportsService.getReceivables(biz);
  }

  @Get('payables')
  @ApiOperation({ summary: 'Supplier payables (outstanding dues)' })
  payables(@BusinessId() biz: string) {
    return this.reportsService.getPayables(biz);
  }
}
