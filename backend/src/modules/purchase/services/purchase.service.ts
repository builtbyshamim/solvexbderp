import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import { SupplierEntity } from '../entities/supplier.entity';
import { PurchaseEntity, PurchaseItemEntity, PurchaseStatus, PaymentStatus } from '../entities/purchase.entity';
import { ProductStockEntity } from 'src/modules/inventory/product/entities/product-stock.entity';
import { StockLedgerEntity, StockTransactionType } from 'src/modules/inventory/product/entities/stock-ledger.entity';
import {
  CreatePurchaseDto, CreateSupplierAdjustmentDto, CreateSupplierDto, GetPurchasesDto,
  GetSuppliersDto, UpdateSupplierDto, PaySupplierDto,
  CreatePurchaseReturnDto, GetPurchaseReturnsDto,
} from '../dto/purchase.dto';
import { PurchaseReturnEntity, PurchaseReturnItemEntity, ReturnStatus } from '../entities/purchase-return.entity';
import { SupplierLedgerAdjustmentEntity, AdjustmentType } from '../entities/supplier-adjustment.entity';
import { AccountEntity } from 'src/modules/accounting/entities/account.entity';
import { AccountLedgerEntity, LedgerTransactionType } from 'src/modules/accounting/entities/account-ledger.entity';
import { StockLocationService } from 'src/modules/inventory/warehouse/services/stock-location.service';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(SupplierEntity)
    private readonly supplierRepo: Repository<SupplierEntity>,
    @InjectRepository(PurchaseEntity)
    private readonly purchaseRepo: Repository<PurchaseEntity>,
    @InjectRepository(PurchaseItemEntity)
    private readonly purchaseItemRepo: Repository<PurchaseItemEntity>,
    @InjectRepository(ProductStockEntity)
    private readonly stockRepo: Repository<ProductStockEntity>,
    @InjectRepository(StockLedgerEntity)
    private readonly ledgerRepo: Repository<StockLedgerEntity>,
    @InjectRepository(SupplierLedgerAdjustmentEntity)
    private readonly supplierAdjustmentRepo: Repository<SupplierLedgerAdjustmentEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(AccountLedgerEntity)
    private readonly accountLedgerRepo: Repository<AccountLedgerEntity>,
    @InjectRepository(PurchaseReturnEntity)
    private readonly purchaseReturnRepo: Repository<PurchaseReturnEntity>,
    private readonly locationService: StockLocationService,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Supplier CRUD ───────────────────────────────────────────────────────────

  async createSupplier(businessId: string, dto: CreateSupplierDto) {
    const exists = await this.supplierRepo.findOne({ where: { businessId, name: ILike(dto.name) } });
    if (exists) throw new ConflictException('Supplier name already exists');
    const supplier = this.supplierRepo.create({
      ...dto,
      businessId,
      openingBalance: dto.openingBalance ?? 0,
      currentBalance: dto.openingBalance ?? 0,
    });
    return this.supplierRepo.save(supplier);
  }

  async findAllSuppliers(businessId: string, query: GetSuppliersDto) {
    const { search = '', page = 1, limit = 10 } = query;
    const where: any = { businessId };
    if (search) where.name = ILike(`%${search}%`);
    const [data, totalItems] = await this.supplierRepo.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  async findSupplier(businessId: string, id: string) {
    const s = await this.supplierRepo.findOne({ where: { id, businessId } });
    if (!s) throw new NotFoundException('Supplier not found');
    return s;
  }

  async updateSupplier(businessId: string, id: string, dto: UpdateSupplierDto) {
    const supplier = await this.findSupplier(businessId, id);
    Object.assign(supplier, dto);
    return this.supplierRepo.save(supplier);
  }

  async deleteSupplier(businessId: string, id: string) {
    const supplier = await this.findSupplier(businessId, id);
    await this.supplierRepo.remove(supplier);
    return { message: 'Supplier deleted successfully' };
  }

  // ─── Purchase CRUD ───────────────────────────────────────────────────────────

  private generateInvoiceNo(): string {
    const ts = Date.now().toString().slice(-6);
    return `PO-${ts}`;
  }

  async createPurchase(businessId: string, userId: string, dto: CreatePurchaseDto) {
    return this.dataSource.transaction(async (tx) => {
      // Calculate totals
      let subtotal = 0;
      for (const item of dto.items) {
        const lineTotal = Number(item.quantity) * Number(item.unitCost) - Number(item.discountAmount ?? 0);
        subtotal += lineTotal;
      }
      const discount = dto.discountAmount ?? 0;
      const tax = dto.taxAmount ?? 0;
      const shipping = dto.shippingCost ?? 0;
      const grandTotal = subtotal - discount + tax + shipping;

      // Paid = sum of all payment splits
      const payments = dto.payments ?? [];
      const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
      const due = grandTotal - paid;

      // Resolve location for all stock operations in this purchase
      const location = await this.locationService.resolve(businessId, dto.warehouseId, tx);

      const purchase = tx.create(PurchaseEntity, {
        businessId,
        supplierId: dto.supplierId,
        warehouseId: dto.warehouseId ?? undefined,
        invoiceNo: dto.invoiceNo || this.generateInvoiceNo(),
        purchaseDate: new Date(dto.purchaseDate),
        subtotal,
        discountAmount: discount,
        taxAmount: tax,
        shippingCost: shipping,
        grandTotal,
        paidAmount: paid,
        dueAmount: due,
        status: PurchaseStatus.CONFIRMED,
        paymentStatus: paid === 0 ? PaymentStatus.UNPAID : paid >= grandTotal ? PaymentStatus.PAID : PaymentStatus.PARTIAL,
        note: dto.note,
        createdBy: userId,
      });
      const savedPurchase = await tx.save(PurchaseEntity, purchase);

      // Save items + update stock
      for (const item of dto.items) {
        const lineTotal = Number(item.quantity) * Number(item.unitCost) - Number(item.discountAmount ?? 0);
        await tx.save(PurchaseItemEntity, {
          purchaseId: savedPurchase.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          discountAmount: item.discountAmount ?? 0,
          total: lineTotal,
        });

        // Update or create stock using resolved location
        let stock = await tx.findOne(ProductStockEntity, {
          where: { businessId, productId: item.productId, locationId: location.id },
        });
        if (!stock) {
          stock = tx.create(ProductStockEntity, {
            businessId,
            productId: item.productId,
            locationId: location.id,
            openingQty: 0, inQty: 0, outQty: 0, currentQty: 0, reservedQty: 0, avgCost: item.unitCost,
            isActive: true,
          });
        }

        const prevQty = Number(stock.currentQty);
        const prevCost = Number(stock.avgCost);
        const newQty = prevQty + Number(item.quantity);
        // Weighted average cost
        stock.avgCost = newQty > 0
          ? (prevQty * prevCost + Number(item.quantity) * Number(item.unitCost)) / newQty
          : item.unitCost;
        stock.inQty = Number(stock.inQty) + Number(item.quantity);
        stock.currentQty = newQty;
        await tx.save(ProductStockEntity, stock);

        // Stock ledger
        await tx.save(StockLedgerEntity, {
          businessId,
          productId: item.productId,
          locationId: location.id,
          transactionType: StockTransactionType.PURCHASE,
          referenceType: 'purchase',
          referenceId: savedPurchase.id,
          qtyIn: item.quantity,
          qtyOut: 0,
          balanceAfter: newQty,
          unitCost: item.unitCost,
          createdBy: userId,
        });
      }

      // Update supplier balance (payable increases by due amount)
      if (dto.supplierId && due > 0) {
        await tx.increment(SupplierEntity, { id: dto.supplierId, businessId }, 'currentBalance', due);
      }

      // Account ledger: one entry per payment split
      for (const split of payments) {
        const account = await tx.findOne(AccountEntity, { where: { id: split.accountId, businessId } });
        if (!account) throw new NotFoundException(`Payment account ${split.accountId} not found`);
        if (Number(account.currentBalance) < Number(split.amount)) {
          throw new BadRequestException(
            `Insufficient balance in "${account.name}". Available: ৳${Number(account.currentBalance).toFixed(2)}, required: ৳${Number(split.amount).toFixed(2)}`,
          );
        }
        const newAccountBalance = Number(account.currentBalance) - Number(split.amount);
        await tx.decrement(AccountEntity, { id: account.id }, 'currentBalance', Number(split.amount));
        await tx.save(AccountLedgerEntity, {
          businessId,
          accountId: account.id,
          transactionDate: new Date(dto.purchaseDate),
          transactionType: LedgerTransactionType.PURCHASE_PAYMENT,
          referenceType: 'purchase',
          referenceId: savedPurchase.id,
          debit: 0,
          credit: Number(split.amount),
          balanceAfter: newAccountBalance,
          note: `Purchase payment — Invoice ${savedPurchase.invoiceNo}`,
          createdBy: userId,
        });
      }

      return tx.findOne(PurchaseEntity, {
        where: { id: savedPurchase.id },
        relations: ['items', 'supplier'],
      });
    });
  }

  async deletePurchase(businessId: string, id: string) {
    return this.dataSource.transaction(async (tx) => {
      const purchase = await tx.findOne(PurchaseEntity, {
        where: { id, businessId },
        relations: ['items'],
      });
      if (!purchase) throw new NotFoundException('Purchase not found');

      // 1. Reverse stock for each item
      for (const item of purchase.items ?? []) {
        const stock = await tx.findOne(ProductStockEntity, {
          where: { businessId, productId: item.productId },
        });
        if (stock) {
          const revertQty = Number(item.quantity);
          stock.inQty = Math.max(0, Number(stock.inQty) - revertQty);
          stock.currentQty = Math.max(0, Number(stock.currentQty) - revertQty);
          await tx.save(ProductStockEntity, stock);
        }
        // Delete stock ledger entries for this purchase
        await tx.delete(StockLedgerEntity, { referenceType: 'purchase', referenceId: id, productId: item.productId });
      }

      // 2. Restore account balances — find all ledger entries for this purchase
      const accountEntries = await tx.find(AccountLedgerEntity, {
        where: { businessId, referenceType: 'purchase', referenceId: id },
      });
      // Group by accountId, sum credits
      const creditByAccount = new Map<string, number>();
      for (const entry of accountEntries) {
        const prev = creditByAccount.get(entry.accountId) ?? 0;
        creditByAccount.set(entry.accountId, prev + Number(entry.credit));
      }
      for (const [accountId, totalCredit] of creditByAccount) {
        if (totalCredit > 0) {
          await tx.increment(AccountEntity, { id: accountId, businessId }, 'currentBalance', totalCredit);
        }
      }
      await tx.delete(AccountLedgerEntity, { businessId, referenceType: 'purchase', referenceId: id });

      // 3. Reverse supplier payable (only remaining due portion was added to supplier balance)
      const dueAmount = Number(purchase.dueAmount);
      if (purchase.supplierId && dueAmount > 0) {
        await tx.decrement(SupplierEntity, { id: purchase.supplierId, businessId }, 'currentBalance', dueAmount);
      }

      // 4. Delete purchase (items cascade via onDelete: CASCADE on FK)
      await tx.delete(PurchaseEntity, { id, businessId });

      return { message: 'Purchase deleted successfully', id };
    });
  }

  async findAllPurchases(businessId: string, query: GetPurchasesDto) {
    const { page = 1, limit = 10, supplierId, status, dateFrom, dateTo, search } = query;
    const qb = this.purchaseRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.supplier', 'supplier')
      .where('p.businessId = :businessId', { businessId });

    if (search) qb.andWhere('p.invoiceNo ILIKE :s', { s: `%${search}%` });
    if (supplierId) qb.andWhere('p.supplierId = :supplierId', { supplierId });
    if (status) qb.andWhere('p.status = :status', { status });
    if (dateFrom) qb.andWhere('p.purchaseDate >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('p.purchaseDate <= :dateTo', { dateTo });

    qb.orderBy('p.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, totalItems] = await qb.getManyAndCount();

    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  async findPurchase(businessId: string, id: string) {
    const p = await this.purchaseRepo.findOne({
      where: { id, businessId },
      relations: ['items', 'supplier'],
    });
    if (!p) throw new NotFoundException('Purchase not found');

    if (p.items?.length) {
      const productIds = p.items.map((i) => i.productId);
      const products: { id: string; name: string }[] = await this.dataSource.query(
        'SELECT id, name FROM products WHERE id = ANY($1::uuid[])',
        [productIds],
      );
      const nameMap = new Map(products.map((pr) => [pr.id, pr.name]));
      (p as any).items = p.items.map((item) => ({
        ...item,
        product: { name: nameMap.get(item.productId) ?? item.productId },
      }));
    }

    return p;
  }

  async getSupplierDuePurchases(businessId: string, supplierId: string) {
    const supplier = await this.findSupplier(businessId, supplierId);
    const purchases = await this.purchaseRepo.find({
      where: { businessId, supplierId },
      order: { purchaseDate: 'ASC', createdAt: 'ASC' },
    });
    const duePurchases = purchases.filter((p) => Number(p.dueAmount) > 0);
    return { supplier, data: duePurchases };
  }

  async paySupplier(businessId: string, supplierId: string, dto: PaySupplierDto) {
    return this.dataSource.transaction(async (tx) => {
      const supplier = await tx.findOne(SupplierEntity, { where: { id: supplierId, businessId } });
      if (!supplier) throw new NotFoundException('Supplier not found');

      if (!dto.payments?.length) {
        throw new BadRequestException('At least one payment split is required');
      }

      const totalPaid = dto.payments.reduce((s, p) => s + Number(p.amount), 0);
      const currentBalance = Number(supplier.currentBalance);

      if (totalPaid > currentBalance + 0.01) {
        throw new BadRequestException(
          `Payment ৳${totalPaid.toFixed(2)} exceeds supplier payable balance ৳${currentBalance.toFixed(2)}`,
        );
      }

      // Validate all account balances up front before any mutations
      for (const split of dto.payments) {
        const account = await tx.findOne(AccountEntity, { where: { id: split.accountId, businessId } });
        if (!account) throw new NotFoundException(`Account ${split.accountId} not found`);
        if (Number(account.currentBalance) < Number(split.amount)) {
          throw new BadRequestException(
            `Insufficient balance in "${account.name}". Available: ৳${Number(account.currentBalance).toFixed(2)}, required: ৳${Number(split.amount).toFixed(2)}`,
          );
        }
      }

      // Distribute payment across invoices
      if (dto.invoicePayments?.length) {
        // ── Invoice-wise: pay specific purchases ──
        for (const item of dto.invoicePayments) {
          const purchase = await tx.findOne(PurchaseEntity, {
            where: { id: item.purchaseId, businessId, supplierId },
          });
          if (!purchase) throw new NotFoundException(`Purchase ${item.purchaseId} not found`);

          const payable = Math.min(Number(item.amount), Number(purchase.dueAmount));
          purchase.paidAmount = Number(purchase.paidAmount) + payable;
          purchase.dueAmount = Number(purchase.dueAmount) - payable;
          purchase.paymentStatus =
            purchase.dueAmount <= 0.009
              ? PaymentStatus.PAID
              : Number(purchase.paidAmount) > 0
                ? PaymentStatus.PARTIAL
                : PaymentStatus.UNPAID;
          if (purchase.dueAmount < 0) purchase.dueAmount = 0;
          await tx.save(PurchaseEntity, purchase);
        }
      } else {
        // ── Bulk: auto-distribute oldest-first ──
        const duePurchases = await this.purchaseRepo.find({
          where: { businessId, supplierId },
          order: { purchaseDate: 'ASC', createdAt: 'ASC' },
        });
        let remaining = totalPaid;
        for (const purchase of duePurchases) {
          if (remaining <= 0) break;
          const due = Number(purchase.dueAmount);
          if (due <= 0) continue;
          const payable = Math.min(remaining, due);
          purchase.paidAmount = Number(purchase.paidAmount) + payable;
          purchase.dueAmount = due - payable;
          purchase.paymentStatus =
            purchase.dueAmount <= 0.009
              ? PaymentStatus.PAID
              : PaymentStatus.PARTIAL;
          if (purchase.dueAmount < 0) purchase.dueAmount = 0;
          await tx.save(PurchaseEntity, purchase);
          remaining -= payable;
        }
      }

      // Reduce supplier payable balance
      const newSupplierBalance = Math.max(0, currentBalance - totalPaid);
      await tx.update(SupplierEntity, { id: supplierId, businessId }, { currentBalance: newSupplierBalance });

      // Account ledger: one entry per payment split
      const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();
      for (const split of dto.payments) {
        const account = await tx.findOne(AccountEntity, { where: { id: split.accountId, businessId } });
        const newAccountBalance = Number(account!.currentBalance) - Number(split.amount);
        await tx.decrement(AccountEntity, { id: split.accountId }, 'currentBalance', Number(split.amount));
        await tx.save(AccountLedgerEntity, {
          businessId,
          accountId: split.accountId,
          transactionDate: paymentDate,
          transactionType: LedgerTransactionType.PURCHASE_PAYMENT,
          referenceType: 'supplier',
          referenceId: supplierId,
          debit: 0,
          credit: Number(split.amount),
          balanceAfter: newAccountBalance,
          note: dto.note ?? `Supplier payment — ${supplier.name}`,
        });
      }

      return {
        message: 'Payment recorded successfully',
        totalPaid,
        remainingBalance: newSupplierBalance,
      };
    });
  }

  async createSupplierAdjustment(
    businessId: string,
    supplierId: string,
    dto: CreateSupplierAdjustmentDto,
    userId: string,
  ) {
    const supplier = await this.findSupplier(businessId, supplierId);
    const adj = this.supplierAdjustmentRepo.create({
      businessId,
      supplierId,
      date: new Date(dto.date),
      type: dto.type as AdjustmentType,
      amount: dto.amount,
      note: dto.note,
      createdBy: userId,
    });
    await this.supplierAdjustmentRepo.save(adj);

    // Debit = we owe more; Credit = we owe less
    const delta = dto.type === 'debit' ? Number(dto.amount) : -Number(dto.amount);
    const newBalance = Math.max(0, Number(supplier.currentBalance) + delta);
    await this.supplierRepo.update({ id: supplierId, businessId }, { currentBalance: newBalance });

    return adj;
  }

  async getSupplierLedger(
    businessId: string,
    supplierId: string,
    query: { page?: number; limit?: number },
  ) {
    const supplier = await this.findSupplier(businessId, supplierId);
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);

    const [purchases, adjustments] = await Promise.all([
      this.purchaseRepo.find({
        where: { businessId, supplierId },
        order: { purchaseDate: 'ASC', createdAt: 'ASC' },
      }),
      this.supplierAdjustmentRepo.find({
        where: { businessId, supplierId },
        order: { date: 'ASC', createdAt: 'ASC' },
      }),
    ]);

    // Merge into unified entries
    const allEntries: any[] = [
      ...purchases.map((p) => ({
        id: p.id,
        date: p.purchaseDate,
        _sortKey: new Date(p.purchaseDate).getTime(),
        _tieBreak: p.createdAt,
        referenceId: p.invoiceNo,
        transactionType: 'purchase',
        debit: Number(p.grandTotal),
        credit: Number(p.paidAmount),
        note: p.note,
      })),
      ...adjustments.map((a) => ({
        id: a.id,
        date: a.date,
        _sortKey: new Date(a.date).getTime(),
        _tieBreak: a.createdAt,
        referenceId: `ADJ-${a.id.slice(0, 8).toUpperCase()}`,
        transactionType: 'adjustment',
        debit: a.type === AdjustmentType.DEBIT ? Number(a.amount) : 0,
        credit: a.type === AdjustmentType.CREDIT ? Number(a.amount) : 0,
        note: a.note,
      })),
    ];

    allEntries.sort((a, b) => a._sortKey - b._sortKey || (a._tieBreak > b._tieBreak ? 1 : -1));

    // Compute running balance
    let balance = Number(supplier.openingBalance);
    for (const entry of allEntries) {
      balance += entry.debit - entry.credit;
      entry.balanceAfter = balance;
    }

    // Paginate (oldest first — ASC)
    const totalItems = allEntries.length;
    const paginated = allEntries.slice((page - 1) * limit, page * limit);

    return {
      supplier,
      data: paginated,
      meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page },
    };
  }

  // ─── Purchase Returns ────────────────────────────────────────────────────────

  async createPurchaseReturn(businessId: string, dto: CreatePurchaseReturnDto, userId: string) {
    return this.dataSource.transaction(async (tx) => {
      const purchase = await tx.findOne(PurchaseEntity, {
        where: { id: dto.purchaseId, businessId },
        relations: ['items'],
      });
      if (!purchase) throw new NotFoundException('Purchase not found');

      // Validate return quantities against original purchase items
      for (const item of dto.items) {
        const original = purchase.items.find((i) => i.productId === item.productId);
        if (!original) throw new BadRequestException(`Product ${item.productId} not found in this purchase`);
        if (Number(item.quantity) > Number(original.quantity)) {
          throw new BadRequestException(`Return qty (${item.quantity}) exceeds purchased qty (${original.quantity}) for product`);
        }
      }

      const totalAmount = dto.items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitCost), 0);
      const refNo = `PR-${Date.now().toString().slice(-8)}`;

      const ret = tx.create(PurchaseReturnEntity, {
        businessId,
        purchaseId: dto.purchaseId,
        supplierId: purchase.supplierId,
        referenceNo: refNo,
        returnDate: dto.returnDate ? new Date(dto.returnDate) : new Date(),
        totalAmount,
        status: ReturnStatus.PENDING,
        reason: dto.reason,
        note: dto.note,
        createdBy: userId,
      });
      const saved = await tx.save(PurchaseReturnEntity, ret);

      for (const item of dto.items) {
        await tx.save(PurchaseReturnItemEntity, {
          purchaseReturnId: saved.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitCost: item.unitCost,
          total: Number(item.quantity) * Number(item.unitCost),
        });
      }

      return tx.findOne(PurchaseReturnEntity, {
        where: { id: saved.id },
        relations: ['items', 'purchase', 'supplier'],
      });
    });
  }

  async findAllPurchaseReturns(businessId: string, query: GetPurchaseReturnsDto) {
    const { search = '', page = 1, limit = 10 } = query;
    const qb = this.purchaseReturnRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.purchase', 'purchase')
      .leftJoinAndSelect('r.supplier', 'supplier')
      .leftJoinAndSelect('r.items', 'items')
      .where('r.businessId = :businessId', { businessId });

    if (search) {
      qb.andWhere('(r.referenceNo ILIKE :s OR supplier.name ILIKE :s OR purchase.invoiceNo ILIKE :s)', { s: `%${search}%` });
    }

    qb.orderBy('r.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, totalItems] = await qb.getManyAndCount();
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  async approvePurchaseReturn(businessId: string, id: string) {
    return this.dataSource.transaction(async (tx) => {
      const ret = await tx.findOne(PurchaseReturnEntity, {
        where: { id, businessId },
        relations: ['items', 'purchase'],
      });
      if (!ret) throw new NotFoundException('Purchase return not found');
      if (ret.status !== ReturnStatus.PENDING) throw new BadRequestException('Only pending returns can be approved');

      const location = await this.locationService.resolve(businessId, ret.purchase.warehouseId, tx);

      // Reverse stock for each returned item
      for (const item of ret.items) {
        const stock = await tx.findOne(ProductStockEntity, {
          where: { businessId, productId: item.productId, locationId: location.id },
        });
        if (stock) {
          stock.outQty = Number(stock.outQty) + Number(item.quantity);
          stock.currentQty = Math.max(0, Number(stock.currentQty) - Number(item.quantity));
          await tx.save(ProductStockEntity, stock);
        }

        await tx.save(StockLedgerEntity, {
          businessId,
          productId: item.productId,
          locationId: location.id,
          transactionType: StockTransactionType.PURCHASE_RETURN,
          referenceType: 'purchase_return',
          referenceId: ret.id,
          qtyIn: 0,
          qtyOut: item.quantity,
          balanceAfter: stock ? Math.max(0, Number(stock.currentQty)) : 0,
          unitCost: item.unitCost,
        });
      }

      // Reduce supplier payable balance (return reduces what we owe)
      if (ret.supplierId && Number(ret.totalAmount) > 0) {
        const supplier = await tx.findOne(SupplierEntity, { where: { id: ret.supplierId, businessId } });
        if (supplier) {
          const reduction = Math.min(Number(ret.totalAmount), Number(supplier.currentBalance));
          if (reduction > 0) {
            await tx.decrement(SupplierEntity, { id: ret.supplierId, businessId }, 'currentBalance', reduction);
          }
        }
      }

      // Update purchase totals
      const purchase = ret.purchase;
      const newGrandTotal = Math.max(0, Number(purchase.grandTotal) - Number(ret.totalAmount));
      const newDue = Math.max(0, Number(purchase.dueAmount) - Number(ret.totalAmount));
      purchase.grandTotal = newGrandTotal;
      purchase.dueAmount = newDue;
      if (newDue <= 0 && Number(purchase.paidAmount) >= newGrandTotal) {
        purchase.paymentStatus = PaymentStatus.PAID;
      }
      await tx.save(PurchaseEntity, purchase);

      ret.status = ReturnStatus.APPROVED;
      return tx.save(PurchaseReturnEntity, ret);
    });
  }
}
