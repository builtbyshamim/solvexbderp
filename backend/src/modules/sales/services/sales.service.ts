import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import { CustomerEntity } from '../entities/customer.entity';
import { SaleEntity, SaleItemEntity, SaleStatus, PaymentStatus } from '../entities/sale.entity';
import { ProductStockEntity } from 'src/modules/inventory/product/entities/product-stock.entity';
import { StockLedgerEntity, StockTransactionType } from 'src/modules/inventory/product/entities/stock-ledger.entity';
import {
  CreateCustomerDto, CreateSaleDto, GetCustomersDto,
  GetSalesDto, UpdateCustomerDto,
} from '../dto/sales.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
    @InjectRepository(SaleEntity)
    private readonly saleRepo: Repository<SaleEntity>,
    @InjectRepository(SaleItemEntity)
    private readonly saleItemRepo: Repository<SaleItemEntity>,
    @InjectRepository(ProductStockEntity)
    private readonly stockRepo: Repository<ProductStockEntity>,
    @InjectRepository(StockLedgerEntity)
    private readonly ledgerRepo: Repository<StockLedgerEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Customer CRUD ────────────────────────────────────────────────────────

  async createCustomer(businessId: string, dto: CreateCustomerDto) {
    const exists = await this.customerRepo.findOne({ where: { businessId, name: ILike(dto.name) } });
    if (exists) throw new ConflictException('Customer name already exists');
    const c = this.customerRepo.create({
      ...dto, businessId,
      openingBalance: dto.openingBalance ?? 0,
      currentBalance: dto.openingBalance ?? 0,
    });
    return this.customerRepo.save(c);
  }

  async findAllCustomers(businessId: string, query: GetCustomersDto) {
    const { search = '', page = 1, limit = 10 } = query;
    const where: any = { businessId };
    if (search) where.name = ILike(`%${search}%`);
    const [data, totalItems] = await this.customerRepo.findAndCount({
      where, order: { name: 'ASC' },
      skip: (page - 1) * limit, take: limit,
    });
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  async findCustomer(businessId: string, id: string) {
    const c = await this.customerRepo.findOne({ where: { id, businessId } });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  async updateCustomer(businessId: string, id: string, dto: UpdateCustomerDto) {
    const c = await this.findCustomer(businessId, id);
    Object.assign(c, dto);
    return this.customerRepo.save(c);
  }

  async deleteCustomer(businessId: string, id: string) {
    const c = await this.findCustomer(businessId, id);
    await this.customerRepo.remove(c);
    return { message: 'Customer deleted successfully' };
  }

  // ─── Sales ────────────────────────────────────────────────────────────────

  private generateInvoiceNo(): string {
    return `INV-${Date.now().toString().slice(-6)}`;
  }

  async createSale(businessId: string, userId: string, dto: CreateSaleDto) {
    return this.dataSource.transaction(async (tx) => {
      let subtotal = 0;
      let totalProfit = 0;

      // Validate stock and calculate totals
      const itemsData: Array<{
        productId: string; quantity: number; unitPrice: number;
        discountAmount: number; total: number; costPrice: number; profit: number;
      }> = [];

      for (const item of dto.items) {
        const stock = await tx.findOne(ProductStockEntity, {
          where: { businessId, productId: item.productId, warehouseId: dto.warehouseId },
        });
        if (!stock || Number(stock.currentQty) < Number(item.quantity)) {
          throw new BadRequestException(
            `Insufficient stock for product ${item.productId}. Available: ${stock?.currentQty ?? 0}`,
          );
        }
        const discount = item.discountAmount ?? 0;
        const lineTotal = Number(item.quantity) * Number(item.unitPrice) - discount;
        const costPrice = Number(stock.avgCost);
        const profit = lineTotal - Number(item.quantity) * costPrice;
        subtotal += lineTotal;
        totalProfit += profit;
        itemsData.push({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discountAmount: discount,
          total: lineTotal,
          costPrice,
          profit,
        });
      }

      const discount = dto.discountAmount ?? 0;
      const tax = dto.taxAmount ?? 0;
      const grandTotal = subtotal - discount + tax;
      const paid = dto.paidAmount ?? 0;
      const due = grandTotal - paid;

      const sale = tx.create(SaleEntity, {
        businessId,
        customerId: dto.customerId,
        warehouseId: dto.warehouseId,
        invoiceNo: dto.invoiceNo || this.generateInvoiceNo(),
        saleDate: new Date(dto.saleDate),
        subtotal,
        discountAmount: discount,
        taxAmount: tax,
        grandTotal,
        paidAmount: paid,
        dueAmount: due,
        totalProfit,
        status: SaleStatus.CONFIRMED,
        paymentStatus: paid === 0 ? PaymentStatus.UNPAID : paid >= grandTotal ? PaymentStatus.PAID : PaymentStatus.PARTIAL,
        note: dto.note,
        createdBy: userId,
      });
      const savedSale = await tx.save(SaleEntity, sale);

      // Save items + deduct stock
      for (const item of itemsData) {
        await tx.save(SaleItemEntity, { ...item, saleId: savedSale.id });

        const stock = await tx.findOne(ProductStockEntity, {
          where: { businessId, productId: item.productId, warehouseId: dto.warehouseId },
        });
        stock!.currentQty = Number(stock!.currentQty) - item.quantity;
        stock!.outQty = Number(stock!.outQty) + item.quantity;
        await tx.save(ProductStockEntity, stock!);

        await tx.save(StockLedgerEntity, {
          businessId,
          productId: item.productId,
          warehouseId: dto.warehouseId,
          transactionType: StockTransactionType.SALE,
          referenceType: 'sale',
          referenceId: savedSale.id,
          qtyIn: 0,
          qtyOut: item.quantity,
          balanceAfter: stock!.currentQty,
          unitCost: item.costPrice,
          createdBy: userId,
        });
      }

      // Update customer balance (receivable increases)
      if (dto.customerId && due > 0) {
        await tx.increment(CustomerEntity, { id: dto.customerId, businessId }, 'currentBalance', due);
      }

      return tx.findOne(SaleEntity, {
        where: { id: savedSale.id },
        relations: ['items', 'customer'],
      });
    });
  }

  async findAllSales(businessId: string, query: GetSalesDto) {
    const { page = 1, limit = 10, customerId, status, dateFrom, dateTo, search } = query;
    const qb = this.saleRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.customer', 'customer')
      .where('s.businessId = :businessId', { businessId });

    if (search) qb.andWhere('s.invoiceNo ILIKE :s', { s: `%${search}%` });
    if (customerId) qb.andWhere('s.customerId = :customerId', { customerId });
    if (status) qb.andWhere('s.status = :status', { status });
    if (dateFrom) qb.andWhere('s.saleDate >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('s.saleDate <= :dateTo', { dateTo });

    qb.orderBy('s.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, totalItems] = await qb.getManyAndCount();

    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  async findSale(businessId: string, id: string) {
    const s = await this.saleRepo.findOne({
      where: { id, businessId },
      relations: ['items', 'customer'],
    });
    if (!s) throw new NotFoundException('Sale not found');
    return s;
  }

  async getDashboardStats(businessId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todaySales] = await this.saleRepo.query(
      `SELECT COALESCE(SUM(grand_total), 0) as total, COALESCE(SUM(total_profit), 0) as profit, COUNT(*) as count
       FROM sales WHERE business_id = $1 AND sale_date >= $2 AND sale_date < $3`,
      [businessId, today, tomorrow],
    );

    const [totalDue] = await this.saleRepo.query(
      `SELECT COALESCE(SUM(due_amount), 0) as total FROM sales WHERE business_id = $1 AND due_amount > 0`,
      [businessId],
    );

    return {
      todayRevenue: Number(todaySales?.total ?? 0),
      todayProfit: Number(todaySales?.profit ?? 0),
      todaySalesCount: Number(todaySales?.count ?? 0),
      totalReceivable: Number(totalDue?.total ?? 0),
    };
  }
}
