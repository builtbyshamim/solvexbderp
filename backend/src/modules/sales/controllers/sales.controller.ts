import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SalesService } from '../services/sales.service';
import { CustomerImportExportService } from '../services/customer-import-export.service';
import {
  CreateCustomerDto, CreateCustomerAdjustmentDto, CreateSaleDto, GetCustomersDto, GetSalesDto, UpdateCustomerDto,
  CollectPaymentDto, CreateQuotationDto, GetQuotationsDto, UpdateQuotationStatusDto,
  ConvertQuotationDto, CreateSaleReturnDto, GetSaleReturnsDto, GetCustomerStatementDto,
} from '../dto/sales.dto';
import { BusinessId } from 'src/common/decorators/business-id.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserEntity } from 'src/modules/users/entities/user.entity';

@ApiTags('Sales')
@Controller({ path: 'sales', version: '1' })
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly customerImportExportService: CustomerImportExportService,
  ) {}

  // ── Customers ──────────────────────────────────────────────────────────────

  @Post('customers')
  @ApiOperation({ summary: 'Create customer' })
  createCustomer(@BusinessId() biz: string, @Body() dto: CreateCustomerDto) {
    return this.salesService.createCustomer(biz, dto);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get all customers' })
  getCustomers(@BusinessId() biz: string, @Query() q: GetCustomersDto) {
    return this.salesService.findAllCustomers(biz, q);
  }

  @Get('customers/export')
  @ApiOperation({ summary: 'Export all customers as Excel (.xlsx) with opening & closing balance' })
  async exportCustomers(@BusinessId() biz: string, @Res() res: any) {
    const buffer = await this.customerImportExportService.exportCustomers(biz);
    res.setHeader('Content-Disposition', 'attachment; filename="customers.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  }

  @Get('customers/import-template')
  @ApiOperation({ summary: 'Download the customer import template (.xlsx)' })
  getCustomerImportTemplate(@Res() res: any) {
    const buffer = this.customerImportExportService.getTemplate();
    res.setHeader('Content-Disposition', 'attachment; filename="customer-import-template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  }

  @Post('customers/import')
  @ApiOperation({ summary: 'Import customers from Excel or CSV file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async importCustomers(
    @BusinessId() biz: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Please upload an Excel or CSV file');
    return this.customerImportExportService.importCustomers(biz, file);
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Get customer by ID' })
  getCustomer(@BusinessId() biz: string, @Param('id') id: string) {
    return this.salesService.findCustomer(biz, id);
  }

  @Get('customers/:id/statement')
  @ApiOperation({ summary: 'Get customer statement / ledger' })
  getCustomerStatement(@BusinessId() biz: string, @Param('id') id: string, @Query() q: GetCustomerStatementDto) {
    return this.salesService.getCustomerStatement(biz, id, q);
  }

  @Post('customers/:id/adjust')
  @ApiOperation({ summary: 'Add manual debit/credit adjustment to customer ledger' })
  adjustCustomerLedger(
    @BusinessId() biz: string,
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateCustomerAdjustmentDto,
  ) {
    return this.salesService.createCustomerAdjustment(biz, id, dto, user.id);
  }

  @Patch('customers/:id')
  @ApiOperation({ summary: 'Update customer' })
  updateCustomer(@BusinessId() biz: string, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.salesService.updateCustomer(biz, id, dto);
  }

  @Delete('customers/:id')
  @ApiOperation({ summary: 'Delete customer' })
  deleteCustomer(@BusinessId() biz: string, @Param('id') id: string) {
    return this.salesService.deleteCustomer(biz, id);
  }

  // ── Sales ──────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create sale / invoice' })
  create(@BusinessId() biz: string, @CurrentUser() user: UserEntity, @Body() dto: CreateSaleDto) {
    return this.salesService.createSale(biz, user.id, dto);
  }

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get today revenue / profit / receivable' })
  dashboardStats(@BusinessId() biz: string) {
    return this.salesService.getDashboardStats(biz);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales' })
  findAll(@BusinessId() biz: string, @Query() q: GetSalesDto) {
    return this.salesService.findAllSales(biz, q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale by ID' })
  findOne(@BusinessId() biz: string, @Param('id') id: string) {
    return this.salesService.findSale(biz, id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a sale and reverse stock' })
  cancelSale(@BusinessId() biz: string, @Param('id') id: string) {
    return this.salesService.cancelSale(biz, id);
  }

  @Post(':id/collect-payment')
  @ApiOperation({ summary: 'Collect payment against a due sale' })
  collectPayment(@BusinessId() biz: string, @Param('id') id: string, @Body() dto: CollectPaymentDto) {
    return this.salesService.collectPayment(biz, id, dto);
  }

  // ── Quotations ─────────────────────────────────────────────────────────────

  @Post('quotations')
  @ApiOperation({ summary: 'Create quotation' })
  createQuotation(@BusinessId() biz: string, @Body() dto: CreateQuotationDto) {
    return this.salesService.createQuotation(biz, dto);
  }

  @Get('quotations')
  @ApiOperation({ summary: 'Get all quotations' })
  getQuotations(@BusinessId() biz: string, @Query() q: GetQuotationsDto) {
    return this.salesService.findAllQuotations(biz, q);
  }

  @Patch('quotations/:id/status')
  @ApiOperation({ summary: 'Update quotation status' })
  updateQuotationStatus(@BusinessId() biz: string, @Param('id') id: string, @Body() dto: UpdateQuotationStatusDto) {
    return this.salesService.updateQuotationStatus(biz, id, dto);
  }

  @Post('quotations/:id/convert')
  @ApiOperation({ summary: 'Convert accepted quotation to sale' })
  convertQuotation(
    @BusinessId() biz: string,
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: ConvertQuotationDto,
  ) {
    return this.salesService.convertQuotationToSale(biz, id, user.id, dto);
  }

  // ── Sale Returns ───────────────────────────────────────────────────────────

  @Post('returns')
  @ApiOperation({ summary: 'Create sale return' })
  createReturn(@BusinessId() biz: string, @CurrentUser() user: UserEntity, @Body() dto: CreateSaleReturnDto) {
    return this.salesService.createSaleReturn(biz, user.id, dto);
  }

  @Get('returns')
  @ApiOperation({ summary: 'Get all sale returns' })
  getReturns(@BusinessId() biz: string, @Query() q: GetSaleReturnsDto) {
    return this.salesService.findAllSaleReturns(biz, q);
  }

  @Patch('returns/:id/approve')
  @ApiOperation({ summary: 'Approve a sale return and restore stock' })
  approveReturn(@BusinessId() biz: string, @Param('id') id: string) {
    return this.salesService.approveReturn(biz, id);
  }
}
