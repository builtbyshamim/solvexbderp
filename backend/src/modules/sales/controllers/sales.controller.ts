import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SalesService } from '../services/sales.service';
import {
  CreateCustomerDto, CreateSaleDto, GetCustomersDto,
  GetSalesDto, UpdateCustomerDto,
} from '../dto/sales.dto';
import { BusinessId } from 'src/common/decorators/business-id.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserEntity } from 'src/modules/users/entities/user.entity';

@ApiTags('Sales')
@Controller({ path: 'sales', version: '1' })
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // ── Customers ──
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

  @Get('customers/:id')
  @ApiOperation({ summary: 'Get customer by ID' })
  getCustomer(@BusinessId() biz: string, @Param('id') id: string) {
    return this.salesService.findCustomer(biz, id);
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

  // ── Sales ──
  @Post()
  @ApiOperation({ summary: 'Create sale / invoice' })
  create(
    @BusinessId() biz: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateSaleDto,
  ) {
    return this.salesService.createSale(biz, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales' })
  findAll(@BusinessId() biz: string, @Query() q: GetSalesDto) {
    return this.salesService.findAllSales(biz, q);
  }

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get today revenue / profit / receivable' })
  dashboardStats(@BusinessId() biz: string) {
    return this.salesService.getDashboardStats(biz);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale by ID' })
  findOne(@BusinessId() biz: string, @Param('id') id: string) {
    return this.salesService.findSale(biz, id);
  }
}
