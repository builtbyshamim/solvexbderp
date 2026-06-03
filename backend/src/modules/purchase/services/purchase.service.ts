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
  CreatePurchaseDto, CreateSupplierDto, GetPurchasesDto,
  GetSuppliersDto, UpdateSupplierDto,
} from '../dto/purchase.dto';
import { v4 as uuidv4 } from 'uuid';
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
      const paid = dto.paidAmount ?? 0;
      const due = grandTotal - paid;

      // Resolve location for all stock operations in this purchase
      const location = await this.locationService.resolve(businessId, dto.warehouseId, tx);

      const purchase = tx.create(PurchaseEntity, {
        businessId,
        supplierId: dto.supplierId,
        warehouseId: dto.warehouseId,
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

      // Update supplier balance (payable increases)
      if (dto.supplierId && due > 0) {
        await tx.increment(SupplierEntity, { id: dto.supplierId, businessId }, 'currentBalance', due);
      }

      return tx.findOne(PurchaseEntity, {
        where: { id: savedPurchase.id },
        relations: ['items', 'supplier'],
      });
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

  async getSupplierLedger(
    businessId: string,
    supplierId: string,
    query: { page?: number; limit?: number },
  ) {
    const supplier = await this.findSupplier(businessId, supplierId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [purchases, totalItems] = await this.purchaseRepo.findAndCount({
      where: { businessId, supplierId },
      order: { purchaseDate: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Build ledger rows from purchases (each purchase = debit row)
    let runningBalance = Number(supplier.openingBalance);
    const allPurchases = await this.purchaseRepo.find({
      where: { businessId, supplierId },
      order: { purchaseDate: 'ASC', createdAt: 'ASC' },
    });
    const balanceMap: Record<string, number> = {};
    let bal = Number(supplier.openingBalance);
    for (const p of allPurchases) {
      bal += Number(p.dueAmount);
      balanceMap[p.id] = bal;
    }

    const entries = purchases.map((p) => ({
      id: p.id,
      date: p.purchaseDate,
      referenceId: p.invoiceNo,
      transactionType: 'purchase',
      debit: Number(p.grandTotal),
      credit: Number(p.paidAmount),
      balanceAfter: balanceMap[p.id] ?? 0,
      note: p.note,
    }));

    return {
      supplier,
      data: entries,
      meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) },
    };
  }
}
