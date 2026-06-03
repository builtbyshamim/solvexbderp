import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import { StockLocationService } from 'src/modules/inventory/warehouse/services/stock-location.service';
import { CustomerEntity } from '../entities/customer.entity';
import { SaleEntity, SaleItemEntity, SaleStatus, PaymentStatus } from '../entities/sale.entity';
import { QuotationEntity, QuotationItemEntity, QuotationStatus } from '../entities/quotation.entity';
import { SaleReturnEntity, SaleReturnItemEntity, ReturnStatus } from '../entities/sale-return.entity';
import { ProductStockEntity } from 'src/modules/inventory/product/entities/product-stock.entity';
import { StockLedgerEntity, StockTransactionType } from 'src/modules/inventory/product/entities/stock-ledger.entity';
import {
  CreateCustomerDto, CreateSaleDto, GetCustomersDto, GetSalesDto, UpdateCustomerDto,
  CollectPaymentDto, CreateQuotationDto, GetQuotationsDto, UpdateQuotationStatusDto,
  ConvertQuotationDto, CreateSaleReturnDto, GetSaleReturnsDto, GetCustomerStatementDto,
} from '../dto/sales.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(CustomerEntity) private readonly customerRepo: Repository<CustomerEntity>,
    @InjectRepository(SaleEntity) private readonly saleRepo: Repository<SaleEntity>,
    @InjectRepository(SaleItemEntity) private readonly saleItemRepo: Repository<SaleItemEntity>,
    @InjectRepository(QuotationEntity) private readonly quotationRepo: Repository<QuotationEntity>,
    @InjectRepository(SaleReturnEntity) private readonly returnRepo: Repository<SaleReturnEntity>,
    @InjectRepository(ProductStockEntity) private readonly stockRepo: Repository<ProductStockEntity>,
    @InjectRepository(StockLedgerEntity) private readonly ledgerRepo: Repository<StockLedgerEntity>,
    private readonly locationService: StockLocationService,
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

  async getCustomerStatement(businessId: string, customerId: string, query: GetCustomerStatementDto) {
    const customer = await this.findCustomer(businessId, customerId);
    const { dateFrom, dateTo } = query;

    const qb = this.saleRepo.createQueryBuilder('s')
      .where('s.businessId = :businessId', { businessId })
      .andWhere('s.customerId = :customerId', { customerId })
      .andWhere('s.status != :cancelled', { cancelled: SaleStatus.CANCELLED });

    if (dateFrom) qb.andWhere('s.saleDate >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('s.saleDate <= :dateTo', { dateTo });
    qb.orderBy('s.saleDate', 'ASC').addOrderBy('s.createdAt', 'ASC');

    const sales = await qb.getMany();

    let runningBalance = Number(customer.openingBalance);
    const entries: any[] = [];

    if (Number(customer.openingBalance) !== 0) {
      entries.push({
        date: customer.createdAt,
        reference: 'OPENING',
        type: 'opening',
        debit: Number(customer.openingBalance),
        credit: 0,
        balance: runningBalance,
        note: 'Opening balance',
      });
    }

    for (const s of sales) {
      runningBalance += Number(s.dueAmount);
      entries.push({
        id: s.id,
        date: s.saleDate,
        reference: s.invoiceNo,
        type: 'sale',
        debit: Number(s.grandTotal),
        credit: Number(s.paidAmount),
        balance: runningBalance,
        note: `Sale invoice — ${s.paymentStatus}`,
      });
    }

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        currentBalance: Number(customer.currentBalance),
      },
      entries,
    };
  }

  // ─── Sales ────────────────────────────────────────────────────────────────

  private generateInvoiceNo(): string {
    return `INV-${Date.now().toString().slice(-8)}`;
  }

  private computePaymentStatus(paid: number, grandTotal: number): PaymentStatus {
    if (paid <= 0) return PaymentStatus.UNPAID;
    if (paid >= grandTotal) return PaymentStatus.PAID;
    return PaymentStatus.PARTIAL;
  }

  async createSale(businessId: string, userId: string, dto: CreateSaleDto) {
    return this.dataSource.transaction(async (tx) => {
      // Resolve stock location — defaults to business if no warehouse specified
      const location = await this.locationService.resolve(businessId, dto.warehouseId, tx);

      let subtotal = 0;
      let totalProfit = 0;

      const itemsData: Array<{
        productId: string; quantity: number; unitPrice: number;
        discountAmount: number; total: number; costPrice: number; profit: number;
      }> = [];

      for (const item of dto.items) {
        const stock = await tx.findOne(ProductStockEntity, {
          where: { businessId, productId: item.productId, locationId: location.id },
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
        itemsData.push({ productId: item.productId, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), discountAmount: discount, total: lineTotal, costPrice, profit });
      }

      const discount = dto.discountAmount ?? 0;
      const tax = dto.taxAmount ?? 0;
      const delivery = dto.deliveryCharge ?? 0;
      const grandTotal = subtotal - discount + tax + delivery;

      // Resolve paid amount from payments array (multi-method) or single paidAmount
      const paymentEntries = dto.payments ?? [];
      const paid = paymentEntries.length > 0
        ? paymentEntries.reduce((s, p) => s + Number(p.amount), 0)
        : (dto.paidAmount ?? 0);
      const payMethod = paymentEntries.length === 1
        ? paymentEntries[0].method
        : paymentEntries.length > 1 ? 'split' : (dto.paymentMethod ?? 'cash');
      const due = Math.max(0, grandTotal - paid);

      const sale = tx.create(SaleEntity, {
        businessId, customerId: dto.customerId, warehouseId: dto.warehouseId,
        invoiceNo: dto.invoiceNo || this.generateInvoiceNo(),
        saleDate: new Date(dto.saleDate),
        subtotal, discountAmount: discount, taxAmount: tax,
        deliveryCharge: delivery, grandTotal,
        paidAmount: paid, dueAmount: due, totalProfit,
        status: SaleStatus.CONFIRMED,
        paymentStatus: this.computePaymentStatus(paid, grandTotal),
        paymentMethod: payMethod,
        payments: paymentEntries.length > 0 ? paymentEntries : undefined,
        offerLabel: dto.offerLabel,
        note: dto.note, createdBy: userId,
      });
      const savedSale = await tx.save(SaleEntity, sale);

      for (const item of itemsData) {
        await tx.save(SaleItemEntity, { ...item, saleId: savedSale.id });

        const stock = await tx.findOne(ProductStockEntity, {
          where: { businessId, productId: item.productId, locationId: location.id },
        });
        stock!.currentQty = Number(stock!.currentQty) - item.quantity;
        stock!.outQty = Number(stock!.outQty) + item.quantity;
        await tx.save(ProductStockEntity, stock!);

        await tx.save(StockLedgerEntity, {
          businessId, productId: item.productId, locationId: location.id,
          transactionType: StockTransactionType.SALE, referenceType: 'sale',
          referenceId: savedSale.id, qtyIn: 0, qtyOut: item.quantity,
          balanceAfter: stock!.currentQty, unitCost: item.costPrice, createdBy: userId,
        });
      }

      if (dto.customerId && due > 0) {
        await tx.increment(CustomerEntity, { id: dto.customerId, businessId }, 'currentBalance', due);
      }

      return tx.findOne(SaleEntity, { where: { id: savedSale.id }, relations: ['items', 'customer'] });
    });
  }

  async findAllSales(businessId: string, query: GetSalesDto) {
    const { page = 1, limit = 15, customerId, status, paymentStatus, dateFrom, dateTo, search } = query;
    const qb = this.saleRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.customer', 'customer')
      .where('s.businessId = :businessId', { businessId });

    if (search) qb.andWhere('(s.invoiceNo ILIKE :s OR customer.name ILIKE :s)', { s: `%${search}%` });
    if (customerId) qb.andWhere('s.customerId = :customerId', { customerId });
    if (status) qb.andWhere('s.status = :status', { status });
    if (paymentStatus) qb.andWhere('s.paymentStatus = :paymentStatus', { paymentStatus });
    if (dateFrom) qb.andWhere('s.saleDate >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('s.saleDate <= :dateTo', { dateTo });

    qb.orderBy('s.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, totalItems] = await qb.getManyAndCount();
    const totals = data.reduce((acc, s) => ({
      revenue: acc.revenue + Number(s.grandTotal),
      profit: acc.profit + Number(s.totalProfit),
      due: acc.due + Number(s.dueAmount),
    }), { revenue: 0, profit: 0, due: 0 });

    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) }, totals };
  }

  async findSale(businessId: string, id: string) {
    const s = await this.saleRepo.findOne({ where: { id, businessId }, relations: ['items', 'customer'] });
    if (!s) throw new NotFoundException('Sale not found');

    // Enrich items with product names for display
    if (s.items?.length) {
      const productIds = s.items.map((i) => i.productId);
      const products: { id: string; name: string }[] = await this.dataSource.query(
        'SELECT id, name FROM products WHERE id = ANY($1::uuid[])',
        [productIds],
      );
      const nameMap = new Map(products.map((p) => [p.id, p.name]));
      (s as any).items = s.items.map((item) => ({
        ...item,
        product: { name: nameMap.get(item.productId) ?? item.productId },
      }));
    }

    return s;
  }

  async cancelSale(businessId: string, id: string) {
    return this.dataSource.transaction(async (tx) => {
      const sale = await tx.findOne(SaleEntity, { where: { id, businessId }, relations: ['items'] });
      if (!sale) throw new NotFoundException('Sale not found');
      if (sale.status === SaleStatus.CANCELLED) throw new BadRequestException('Sale is already cancelled');

      const location = await this.locationService.resolve(businessId, sale.warehouseId, tx);

      for (const item of sale.items) {
        const stock = await tx.findOne(ProductStockEntity, {
          where: { businessId, productId: item.productId, locationId: location.id },
        });
        if (stock) {
          stock.currentQty = Number(stock.currentQty) + Number(item.quantity);
          stock.outQty = Math.max(0, Number(stock.outQty) - Number(item.quantity));
          await tx.save(ProductStockEntity, stock);

          await tx.save(StockLedgerEntity, {
            businessId, productId: item.productId, locationId: location.id,
            transactionType: StockTransactionType.ADJUSTMENT_IN, referenceType: 'sale_cancel',
            referenceId: sale.id, qtyIn: Number(item.quantity), qtyOut: 0,
            balanceAfter: stock.currentQty, unitCost: Number(item.costPrice),
          });
        }
      }

      if (sale.customerId && Number(sale.dueAmount) > 0) {
        await tx.decrement(CustomerEntity, { id: sale.customerId, businessId }, 'currentBalance', Number(sale.dueAmount));
      }

      sale.status = SaleStatus.CANCELLED;
      await tx.save(SaleEntity, sale);
      return { message: 'Sale cancelled successfully' };
    });
  }

  async collectPayment(businessId: string, saleId: string, dto: CollectPaymentDto) {
    return this.dataSource.transaction(async (tx) => {
      const sale = await tx.findOne(SaleEntity, { where: { id: saleId, businessId } });
      if (!sale) throw new NotFoundException('Sale not found');
      if (sale.paymentStatus === PaymentStatus.PAID) throw new BadRequestException('Sale is already fully paid');

      const maxCollectable = Number(sale.dueAmount);
      const amount = Math.min(dto.amount, maxCollectable);

      sale.paidAmount = Number(sale.paidAmount) + amount;
      sale.dueAmount = Number(sale.dueAmount) - amount;
      sale.paymentStatus = this.computePaymentStatus(Number(sale.paidAmount), Number(sale.grandTotal));
      await tx.save(SaleEntity, sale);

      if (sale.customerId && amount > 0) {
        await tx.decrement(CustomerEntity, { id: sale.customerId, businessId }, 'currentBalance', amount);
      }

      return sale;
    });
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

  // ─── Quotations ───────────────────────────────────────────────────────────

  async createQuotation(businessId: string, dto: CreateQuotationDto) {
    let subtotal = 0;
    const itemsData = dto.items.map((item) => {
      const discount = item.discountAmount ?? 0;
      const total = Number(item.quantity) * Number(item.unitPrice) - discount;
      subtotal += total;
      return { productId: item.productId, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), discountAmount: discount, total };
    });

    const discount = dto.discountAmount ?? 0;
    const tax = dto.taxAmount ?? 0;
    const grandTotal = subtotal - discount + tax;

    const ref = `QUO-${Date.now().toString().slice(-8)}`;
    const q = this.quotationRepo.create({
      businessId, customerId: dto.customerId, referenceNo: ref,
      quotationDate: new Date(dto.quotationDate),
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      subtotal, discountAmount: discount, taxAmount: tax, grandTotal,
      status: QuotationStatus.DRAFT, note: dto.note,
      items: itemsData as any,
    });
    return this.quotationRepo.save(q);
  }

  async findAllQuotations(businessId: string, query: GetQuotationsDto) {
    const { search = '', page = 1, limit = 15, status } = query;
    const qb = this.quotationRepo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.customer', 'customer')
      .where('q.businessId = :businessId', { businessId });

    if (search) qb.andWhere('(q.referenceNo ILIKE :s OR customer.name ILIKE :s)', { s: `%${search}%` });
    if (status) qb.andWhere('q.status = :status', { status });
    qb.orderBy('q.createdAt', 'DESC').skip((page - 1) * limit).take(limit);

    const [data, totalItems] = await qb.getManyAndCount();
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  async updateQuotationStatus(businessId: string, id: string, dto: UpdateQuotationStatusDto) {
    const q = await this.quotationRepo.findOne({ where: { id, businessId } });
    if (!q) throw new NotFoundException('Quotation not found');
    q.status = dto.status as QuotationStatus;
    return this.quotationRepo.save(q);
  }

  async convertQuotationToSale(businessId: string, id: string, userId: string, dto: ConvertQuotationDto) {
    const q = await this.quotationRepo.findOne({ where: { id, businessId }, relations: ['items'] });
    if (!q) throw new NotFoundException('Quotation not found');
    if (q.status !== QuotationStatus.ACCEPTED) throw new BadRequestException('Only accepted quotations can be converted');

    const saleDto: CreateSaleDto = {
      customerId: q.customerId,
      warehouseId: dto.warehouseId,
      saleDate: dto.saleDate,
      items: q.items.map((i) => ({
        productId: i.productId, quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice), discountAmount: Number(i.discountAmount),
      })),
      discountAmount: Number(q.discountAmount),
      taxAmount: Number(q.taxAmount),
      paidAmount: dto.paidAmount,
      paymentMethod: dto.paymentMethod,
    };

    const sale = await this.createSale(businessId, userId, saleDto);
    q.status = QuotationStatus.CONVERTED;
    await this.quotationRepo.save(q);
    return { sale, message: 'Quotation converted to sale successfully' };
  }

  // ─── Sale Returns ─────────────────────────────────────────────────────────

  async createSaleReturn(businessId: string, userId: string, dto: CreateSaleReturnDto) {
    const sale = await this.saleRepo.findOne({ where: { id: dto.saleId, businessId } });
    if (!sale) throw new NotFoundException('Sale not found');

    const totalAmount = dto.items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
    const ref = `SRN-${Date.now().toString().slice(-8)}`;

    const ret = this.returnRepo.create({
      businessId, saleId: dto.saleId, customerId: sale.customerId,
      referenceNo: ref, returnDate: new Date(dto.returnDate),
      totalAmount, status: ReturnStatus.PENDING,
      reason: dto.reason, note: dto.note, createdBy: userId,
      items: dto.items.map((i) => ({
        productId: i.productId, quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice), total: Number(i.quantity) * Number(i.unitPrice),
      })) as any,
    });
    return this.returnRepo.save(ret);
  }

  async findAllSaleReturns(businessId: string, query: GetSaleReturnsDto) {
    const { search = '', page = 1, limit = 15 } = query;
    const qb = this.returnRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.customer', 'customer')
      .leftJoinAndSelect('r.sale', 'sale')
      .where('r.businessId = :businessId', { businessId });

    if (search) qb.andWhere('(r.referenceNo ILIKE :s OR customer.name ILIKE :s)', { s: `%${search}%` });
    qb.orderBy('r.createdAt', 'DESC').skip((page - 1) * limit).take(limit);

    const [data, totalItems] = await qb.getManyAndCount();
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  async approveReturn(businessId: string, id: string) {
    return this.dataSource.transaction(async (tx) => {
      const ret = await tx.findOne(SaleReturnEntity, { where: { id, businessId }, relations: ['items', 'sale'] });
      if (!ret) throw new NotFoundException('Return not found');
      if (ret.status !== ReturnStatus.PENDING) throw new BadRequestException('Only pending returns can be approved');

      const location = await this.locationService.resolve(businessId, ret.sale.warehouseId, tx);
      for (const item of ret.items) {
        const stock = await tx.findOne(ProductStockEntity, {
          where: { businessId, productId: item.productId, locationId: location.id },
        });
        if (stock) {
          stock.currentQty = Number(stock.currentQty) + Number(item.quantity);
          stock.outQty = Math.max(0, Number(stock.outQty) - Number(item.quantity));
          await tx.save(ProductStockEntity, stock);
        }
      }

      if (ret.customerId && ret.totalAmount > 0) {
        await tx.decrement(CustomerEntity, { id: ret.customerId, businessId }, 'currentBalance', Number(ret.totalAmount));
      }

      ret.status = ReturnStatus.APPROVED;
      await tx.save(SaleReturnEntity, ret);
      return { message: 'Return approved and stock restored' };
    });
  }
}
