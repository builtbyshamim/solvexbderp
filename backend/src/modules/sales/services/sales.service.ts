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
import { CustomerTypeEntity } from '../entities/customer-type.entity';
import { SaleEntity, SaleItemEntity, SaleStatus, PaymentStatus } from '../entities/sale.entity';
import { QuotationEntity, QuotationItemEntity, QuotationStatus } from '../entities/quotation.entity';
import { SaleReturnEntity, SaleReturnItemEntity, ReturnStatus } from '../entities/sale-return.entity';
import { ProductStockEntity } from 'src/modules/inventory/product/entities/product-stock.entity';
import { StockLedgerEntity, StockTransactionType } from 'src/modules/inventory/product/entities/stock-ledger.entity';
import {
  CreateCustomerDto, CreateCustomerAdjustmentDto, CreateSaleDto, GetCustomersDto, GetSalesDto, UpdateCustomerDto,
  CollectPaymentDto, CollectBulkPaymentDto, CreateQuotationDto, GetQuotationsDto, UpdateQuotationStatusDto,
  ConvertQuotationDto, CreateSaleReturnDto, GetSaleReturnsDto, GetCustomerStatementDto,
  CreateCustomerTypeDto, UpdateCustomerTypeDto, CreateCouponDto, UpdateCouponDto, ValidateCouponDto,
} from '../dto/sales.dto';
import { CustomerLedgerAdjustmentEntity, AdjustmentType } from '../entities/customer-adjustment.entity';
import { CouponEntity, DiscountType } from '../entities/coupon.entity';
import { SmsMarketingService } from 'src/modules/sms-marketing/services/sms-marketing.service';
import { TransactionalSmsEvent } from 'src/modules/sms-marketing/entities/transactional-sms.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(CouponEntity) private readonly couponRepo: Repository<CouponEntity>,
    @InjectRepository(CustomerTypeEntity) private readonly customerTypeRepo: Repository<CustomerTypeEntity>,
    @InjectRepository(CustomerEntity) private readonly customerRepo: Repository<CustomerEntity>,
    @InjectRepository(SaleEntity) private readonly saleRepo: Repository<SaleEntity>,
    @InjectRepository(SaleItemEntity) private readonly saleItemRepo: Repository<SaleItemEntity>,
    @InjectRepository(QuotationEntity) private readonly quotationRepo: Repository<QuotationEntity>,
    @InjectRepository(SaleReturnEntity) private readonly returnRepo: Repository<SaleReturnEntity>,
    @InjectRepository(ProductStockEntity) private readonly stockRepo: Repository<ProductStockEntity>,
    @InjectRepository(StockLedgerEntity) private readonly ledgerRepo: Repository<StockLedgerEntity>,
    @InjectRepository(CustomerLedgerAdjustmentEntity)
    private readonly customerAdjustmentRepo: Repository<CustomerLedgerAdjustmentEntity>,
    private readonly locationService: StockLocationService,
    private readonly dataSource: DataSource,
    private readonly smsService: SmsMarketingService,
  ) {}

  // ─── Customer Type CRUD ───────────────────────────────────────────────────

  async createCustomerType(businessId: string, dto: CreateCustomerTypeDto) {
    const exists = await this.customerTypeRepo.findOne({ where: { businessId, name: ILike(dto.name) } });
    if (exists) throw new ConflictException('Customer type name already exists');

    if (dto.isDefault) {
      await this.customerTypeRepo.update({ businessId }, { isDefault: false });
    }

    const ct = this.customerTypeRepo.create({ ...dto, businessId });
    return this.customerTypeRepo.save(ct);
  }

  async findAllCustomerTypes(businessId: string) {
    return this.customerTypeRepo.find({
      where: { businessId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async updateCustomerType(businessId: string, id: string, dto: UpdateCustomerTypeDto) {
    const ct = await this.customerTypeRepo.findOne({ where: { id, businessId } });
    if (!ct) throw new NotFoundException('Customer type not found');

    if (dto.name && dto.name !== ct.name) {
      const nameExists = await this.customerTypeRepo.findOne({ where: { businessId, name: ILike(dto.name) } });
      if (nameExists) throw new ConflictException('Customer type name already exists');
    }

    if (dto.isDefault) {
      await this.customerTypeRepo.update({ businessId }, { isDefault: false });
    }

    Object.assign(ct, dto);
    return this.customerTypeRepo.save(ct);
  }

  async deleteCustomerType(businessId: string, id: string) {
    const ct = await this.customerTypeRepo.findOne({ where: { id, businessId } });
    if (!ct) throw new NotFoundException('Customer type not found');
    const inUse = await this.customerRepo.count({ where: { businessId, customerTypeId: id } });
    if (inUse > 0) throw new BadRequestException(`Cannot delete — ${inUse} customer(s) use this type`);
    await this.customerTypeRepo.remove(ct);
    return { message: 'Customer type deleted' };
  }

  // ─── Customer CRUD ────────────────────────────────────────────────────────

  async createCustomer(businessId: string, dto: CreateCustomerDto) {
    const exists = await this.customerRepo.findOne({ where: { businessId, name: ILike(dto.name) } });
    if (exists) throw new ConflictException('Customer name already exists');

    if (dto.phone) {
      const phoneExists = await this.customerRepo.findOne({ where: { businessId, phone: dto.phone } });
      if (phoneExists) throw new ConflictException(`Mobile number ${dto.phone} is already registered for another customer`);
    }

    const c = this.customerRepo.create({
      ...dto, businessId,
      openingBalance: dto.openingBalance ?? 0,
      currentBalance: dto.openingBalance ?? 0,
    });
    return this.customerRepo.save(c);
  }

  async findAllCustomers(businessId: string, query: GetCustomersDto) {
    const { search = '', page = 1, limit = 10, customerTypeId } = query;
    const where: any = { businessId };
    if (search) where.name = ILike(`%${search}%`);
    if (customerTypeId) where.customerTypeId = customerTypeId;
    const [data, totalItems] = await this.customerRepo.findAndCount({
      where, order: { name: 'ASC' },
      relations: ['customerType'],
      skip: (page - 1) * limit, take: limit,
    });
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  async findCustomer(businessId: string, id: string) {
    const c = await this.customerRepo.findOne({ where: { id, businessId }, relations: ['customerType'] });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  async updateCustomer(businessId: string, id: string, dto: UpdateCustomerDto) {
    const c = await this.findCustomer(businessId, id);

    if (dto.phone && dto.phone !== c.phone) {
      const phoneExists = await this.customerRepo.findOne({ where: { businessId, phone: dto.phone } });
      if (phoneExists && phoneExists.id !== id) {
        throw new ConflictException(`Mobile number ${dto.phone} is already registered for another customer`);
      }
    }

    Object.assign(c, dto);
    return this.customerRepo.save(c);
  }

  async deleteCustomer(businessId: string, id: string) {
    const c = await this.findCustomer(businessId, id);
    await this.customerRepo.remove(c);
    return { message: 'Customer deleted successfully' };
  }

  async createCustomerAdjustment(
    businessId: string,
    customerId: string,
    dto: CreateCustomerAdjustmentDto,
    userId: string,
  ) {
    const customer = await this.findCustomer(businessId, customerId);
    const adj = this.customerAdjustmentRepo.create({
      businessId,
      customerId,
      date: new Date(dto.date),
      type: dto.type as AdjustmentType,
      amount: dto.amount,
      note: dto.note,
      createdBy: userId,
    });
    await this.customerAdjustmentRepo.save(adj);

    // Debit = customer owes more; Credit = customer owes less
    const delta = dto.type === 'debit' ? Number(dto.amount) : -Number(dto.amount);
    const newBalance = Math.max(0, Number(customer.currentBalance) + delta);
    await this.customerRepo.update({ id: customerId, businessId }, { currentBalance: newBalance });

    return adj;
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

    const [sales, adjustments] = await Promise.all([
      qb.getMany(),
      this.customerAdjustmentRepo.find({
        where: { businessId, customerId },
        order: { date: 'ASC', createdAt: 'ASC' },
      }),
    ]);

    // Build unified list of entries
    const rawEntries: any[] = [
      ...sales.map((s) => ({
        id: s.id,
        _sortKey: new Date(s.saleDate).getTime(),
        _tieBreak: s.createdAt,
        date: s.saleDate,
        reference: s.invoiceNo,
        type: 'sale',
        debit: Number(s.grandTotal),
        credit: Number(s.paidAmount),
        note: `Sale invoice — ${s.paymentStatus}`,
      })),
      ...adjustments.map((a) => ({
        id: a.id,
        _sortKey: new Date(a.date).getTime(),
        _tieBreak: a.createdAt,
        date: a.date,
        reference: `ADJ-${a.id.slice(0, 8).toUpperCase()}`,
        type: 'adjustment',
        debit: a.type === AdjustmentType.DEBIT ? Number(a.amount) : 0,
        credit: a.type === AdjustmentType.CREDIT ? Number(a.amount) : 0,
        note: a.note,
      })),
    ];

    rawEntries.sort((a, b) => a._sortKey - b._sortKey || (a._tieBreak > b._tieBreak ? 1 : -1));

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

    for (const e of rawEntries) {
      runningBalance += e.debit - e.credit;
      entries.push({ ...e, balance: runningBalance });
    }

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        customerType: customer.customerType,
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

      let couponDiscount = 0;
      let appliedCoupon: CouponEntity | null = null;
      if (dto.couponCode) {
        appliedCoupon = await tx.findOne(CouponEntity, {
          where: { businessId, code: ILike(dto.couponCode), isActive: true },
        });
        if (!appliedCoupon) throw new BadRequestException(`Coupon "${dto.couponCode}" is invalid or inactive`);
        if (appliedCoupon.expiresAt && appliedCoupon.expiresAt < new Date()) throw new BadRequestException('Coupon has expired');
        if (appliedCoupon.usageLimit !== null && appliedCoupon.usedCount >= appliedCoupon.usageLimit) throw new BadRequestException('Coupon usage limit reached');
        if (subtotal < Number(appliedCoupon.minOrderAmount)) throw new BadRequestException(`Minimum order amount ৳${appliedCoupon.minOrderAmount} required for this coupon`);

        if (appliedCoupon.discountType === DiscountType.PERCENTAGE) {
          couponDiscount = (subtotal * Number(appliedCoupon.discountValue)) / 100;
          if (appliedCoupon.maxDiscountAmount !== null) couponDiscount = Math.min(couponDiscount, Number(appliedCoupon.maxDiscountAmount));
        } else {
          couponDiscount = Math.min(Number(appliedCoupon.discountValue), subtotal);
        }
        couponDiscount = Math.round(couponDiscount * 100) / 100;
      }

      const discount = (dto.discountAmount ?? 0) + couponDiscount;
      const tax = dto.taxAmount ?? 0;
      const delivery = dto.deliveryCharge ?? 0;
      const grandTotal = Math.max(0, subtotal - discount + tax + delivery);

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
        businessId, customerId: dto.customerId, warehouseId: dto.warehouseId ?? undefined,
        invoiceNo: dto.invoiceNo || this.generateInvoiceNo(),
        saleDate: new Date(dto.saleDate),
        subtotal, discountAmount: discount, taxAmount: tax,
        deliveryCharge: delivery, grandTotal,
        paidAmount: paid, dueAmount: due, totalProfit,
        status: SaleStatus.CONFIRMED,
        paymentStatus: this.computePaymentStatus(paid, grandTotal),
        paymentMethod: payMethod,
        payments: paymentEntries.length > 0 ? paymentEntries : undefined,
        offerLabel: dto.offerLabel ?? (appliedCoupon ? `Coupon: ${appliedCoupon.code}` : undefined),
        note: dto.note, createdBy: userId,
      });
      const savedSale = await tx.save(SaleEntity, sale);

      if (appliedCoupon) {
        await tx.increment(CouponEntity, { id: appliedCoupon.id }, 'usedCount', 1);
      }

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
    }).then((sale) => {
      if (sale?.customer?.phone) {
        this.smsService.sendTransactionalSms(businessId, TransactionalSmsEvent.SALE_CREATED, {
          customerName: sale.customer.name,
          customerPhone: sale.customer.phone,
          invoiceNo: sale.invoiceNo,
          totalAmount: Number(sale.grandTotal),
          paidAmount: Number(sale.paidAmount),
          dueAmount: Number(sale.dueAmount),
          saleDate: new Date(sale.saleDate).toLocaleDateString('en-BD'),
        }).catch(() => {});
      }
      return sale;
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
    const result = await this.dataSource.transaction(async (tx) => {
      const sale = await tx.findOne(SaleEntity, { where: { id: saleId, businessId } });
      if (!sale) throw new NotFoundException('Sale not found');
      if (sale.paymentStatus === PaymentStatus.PAID) throw new BadRequestException('Sale is already fully paid');

      const maxDue = Number(sale.dueAmount);
      const rebate = Math.min(dto.rebate ?? 0, maxDue);
      const collectedAmount = Math.min(dto.amount, maxDue - rebate);
      const totalReduction = collectedAmount + rebate;

      sale.paidAmount = Number(sale.paidAmount) + collectedAmount;
      sale.dueAmount = Math.max(0, Number(sale.dueAmount) - totalReduction);
      sale.paymentStatus = this.computePaymentStatus(Number(sale.paidAmount), Number(sale.grandTotal) - rebate);
      if (sale.dueAmount <= 0) sale.paymentStatus = PaymentStatus.PAID;
      await tx.save(SaleEntity, sale);

      if (sale.customerId && totalReduction > 0) {
        await tx.decrement(CustomerEntity, { id: sale.customerId, businessId }, 'currentBalance', totalReduction);
      }

      return { sale, collectedAmount, rebateAmount: rebate };
    });

    if (result.sale.customerId) {
      const customer = await this.customerRepo.findOne({
        where: { id: result.sale.customerId, businessId },
        select: ['id', 'name', 'phone'],
      });
      if (customer?.phone) {
        this.smsService.sendTransactionalSms(businessId, TransactionalSmsEvent.PAYMENT_RECEIVED, {
          customerName: customer.name,
          customerPhone: customer.phone,
          invoiceNo: result.sale.invoiceNo,
          paymentAmount: result.collectedAmount,
          paidAmount: Number(result.sale.paidAmount),
          dueAmount: Number(result.sale.dueAmount),
        }).catch(() => {});
      }
    }

    return result.sale;
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
    const saved = await this.returnRepo.save(ret);

    if (sale.customerId) {
      const customer = await this.customerRepo.findOne({
        where: { id: sale.customerId, businessId },
        select: ['id', 'name', 'phone'],
      });
      if (customer?.phone) {
        this.smsService.sendTransactionalSms(businessId, TransactionalSmsEvent.SALE_RETURN, {
          customerName: customer.name,
          customerPhone: customer.phone,
          invoiceNo: sale.invoiceNo,
          returnAmount: totalAmount,
        }).catch(() => {});
      }
    }

    return saved;
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

  // ─── Bulk Customer Payment Collection ─────────────────────────────────────

  async collectBulkPayment(businessId: string, customerId: string, dto: CollectBulkPaymentDto) {
    const customer = await this.customerRepo.findOne({ where: { id: customerId, businessId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const rebate = dto.rebate ?? 0;
    const totalReduction = dto.amount + rebate;

    return this.dataSource.transaction(async (tx) => {
      // Distribute across unpaid/partial invoices (oldest first)
      const outstandingSales = await tx.find(SaleEntity, {
        where: { businessId, customerId },
        order: { saleDate: 'ASC', createdAt: 'ASC' },
      });

      let remaining = dto.amount;
      let remainingRebate = rebate;

      for (const sale of outstandingSales) {
        if (sale.paymentStatus === PaymentStatus.PAID || Number(sale.dueAmount) <= 0) continue;
        if (remaining <= 0 && remainingRebate <= 0) break;

        const saleDue = Number(sale.dueAmount);
        const applyRebate = Math.min(remainingRebate, saleDue);
        const applyAmount = Math.min(remaining, saleDue - applyRebate);
        const reduction = applyAmount + applyRebate;

        sale.paidAmount = Number(sale.paidAmount) + applyAmount;
        sale.dueAmount = Math.max(0, saleDue - reduction);
        if (sale.dueAmount <= 0) sale.paymentStatus = PaymentStatus.PAID;
        else if (Number(sale.paidAmount) > 0) sale.paymentStatus = PaymentStatus.PARTIAL;
        await tx.save(SaleEntity, sale);

        remaining -= applyAmount;
        remainingRebate -= applyRebate;
      }

      // Decrement customer balance by full reduction
      const actualReduction = Math.min(totalReduction, Number(customer.currentBalance));
      if (actualReduction > 0) {
        await tx.decrement(CustomerEntity, { id: customerId, businessId }, 'currentBalance', actualReduction);
      }

      return { message: 'Bulk collection recorded', amount: dto.amount, rebate };
    });
  }

  // ─── Coupon CRUD ──────────────────────────────────────────────────────────

  async createCoupon(businessId: string, dto: CreateCouponDto) {
    const exists = await this.couponRepo.findOne({ where: { businessId, code: ILike(dto.code) } });
    if (exists) throw new ConflictException(`Coupon code "${dto.code}" already exists`);

    const coupon = this.couponRepo.create({
      businessId,
      code: dto.code.toUpperCase().trim(),
      description: dto.description ?? null,
      discountType: dto.discountType as DiscountType,
      discountValue: dto.discountValue,
      minOrderAmount: dto.minOrderAmount ?? 0,
      maxDiscountAmount: dto.maxDiscountAmount ?? null,
      usageLimit: dto.usageLimit ?? null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      isActive: dto.isActive ?? true,
    });
    return this.couponRepo.save(coupon);
  }

  async findAllCoupons(businessId: string) {
    return this.couponRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateCoupon(businessId: string, id: string, dto: UpdateCouponDto) {
    const coupon = await this.couponRepo.findOne({ where: { id, businessId } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    if (dto.code && dto.code.toUpperCase() !== coupon.code) {
      const exists = await this.couponRepo.findOne({ where: { businessId, code: ILike(dto.code) } });
      if (exists) throw new ConflictException(`Coupon code "${dto.code}" already exists`);
      dto.code = dto.code.toUpperCase().trim();
    }

    Object.assign(coupon, {
      ...dto,
      expiresAt: dto.expiresAt !== undefined ? (dto.expiresAt ? new Date(dto.expiresAt) : null) : coupon.expiresAt,
    });
    return this.couponRepo.save(coupon);
  }

  async deleteCoupon(businessId: string, id: string) {
    const coupon = await this.couponRepo.findOne({ where: { id, businessId } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    await this.couponRepo.remove(coupon);
    return { message: 'Coupon deleted' };
  }

  async validateCoupon(businessId: string, dto: ValidateCouponDto) {
    const coupon = await this.couponRepo.findOne({
      where: { businessId, code: ILike(dto.code), isActive: true },
    });
    if (!coupon) throw new NotFoundException(`Coupon "${dto.code}" is invalid or inactive`);
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException('Coupon has expired');
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) throw new BadRequestException('Coupon usage limit reached');
    if (dto.subtotal < Number(coupon.minOrderAmount)) throw new BadRequestException(`Minimum order amount ৳${coupon.minOrderAmount} required`);

    let discountAmount: number;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (dto.subtotal * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscountAmount !== null) discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
    } else {
      discountAmount = Math.min(Number(coupon.discountValue), dto.subtotal);
    }
    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        description: coupon.description,
      },
      discountAmount,
      finalTotal: Math.max(0, dto.subtotal - discountAmount),
    };
  }
}
