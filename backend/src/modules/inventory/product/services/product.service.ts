import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Not, QueryRunner, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from '../entities/product.entity';
import { ProductStockEntity } from '../entities/product-stock.entity';
import {
  StockLedgerEntity,
  StockTransactionType,
} from '../entities/stock-ledger.entity';
import {
  CreateProductDto,
  GetProductsDto,
  UpdateProductDto,
} from '../dto/product.dto';
import { StockLocationService } from '../../warehouse/services/stock-location.service';
import { StockLocationEntity } from '../../warehouse/entities/stock-location.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(ProductStockEntity)
    private readonly stockRepo: Repository<ProductStockEntity>,
    @InjectRepository(StockLedgerEntity)
    private readonly ledgerRepo: Repository<StockLedgerEntity>,
    private readonly locationService: StockLocationService,
    private readonly dataSource: DataSource,
  ) {}

  // ─── helpers ──────────────────────────────────────────────────────────────

  private createQueryRunner(): QueryRunner {
    return this.dataSource.createQueryRunner();
  }

  private async startTransaction(qr: QueryRunner): Promise<void> {
    await qr.connect();
    await qr.startTransaction();
  }

  // ─── create ───────────────────────────────────────────────────────────────

  async create(businessId: string, userId: string, dto: CreateProductDto) {
    const qr = this.createQueryRunner();
    await this.startTransaction(qr);

    try {
      // SKU uniqueness check
      if (dto.sku) {
        const exists = await qr.manager.findOne(ProductEntity, {
          where: { businessId, sku: dto.sku },
        });
        if (exists)
          throw new ConflictException('SKU already exists in this business');
      }

      // Save product
      const product = qr.manager.create(ProductEntity, {
        ...dto,
        businessId,
        openingStock: dto.openingStock ?? 0,
        purchasePrice: dto.purchasePrice ?? 0,
        sellingPrice: dto.sellingPrice ?? 0,
      });
      const savedProduct = await qr.manager.save(ProductEntity, product);

      // Resolve stock location (warehouse or business default)
      const location = await this.locationService.resolve(
        businessId,
        dto.warehouseId,
        qr.manager,
      );
      const openingQty = dto.openingStock ?? 0;

      // Save product stock row
      const stock = qr.manager.create(ProductStockEntity, {
        businessId,
        productId: savedProduct.id,
        locationId: location.id,
        openingQty,
        inQty: openingQty,
        outQty: 0,
        currentQty: openingQty,
        reservedQty: 0,
        avgCost: dto.purchasePrice ?? 0,
      });
      await qr.manager.save(ProductStockEntity, stock);

      // Create opening ledger entry only when opening qty > 0
      if (openingQty > 0) {
        const ledgerEntry = qr.manager.create(StockLedgerEntity, {
          businessId,
          productId: savedProduct.id,
          locationId: location.id,
          transactionType: StockTransactionType.OPENING,
          qtyIn: openingQty,
          qtyOut: 0,
          balanceAfter: openingQty,
          unitCost: dto.purchasePrice ?? 0,
          totalCost: (dto.purchasePrice ?? 0) * openingQty,
          note: 'Opening stock',
          createdBy: userId,
        });
        await qr.manager.save(StockLedgerEntity, ledgerEntry);
      }

      await qr.commitTransaction();
      return savedProduct;
    } catch (error) {
      await qr.rollbackTransaction();
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException('Failed to create product');
    } finally {
      await qr.release();
    }
  }

  // ─── findAll ──────────────────────────────────────────────────────────────

  async findAll(businessId: string, query: GetProductsDto) {
    try {
      const { search = '', page = 1, limit = 10, categoryId, brandId } = query;
      const skip = (page - 1) * limit;

      const qb = this.productRepo
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.category', 'category')
        .leftJoinAndSelect('p.unit', 'unit')
        .leftJoinAndSelect('p.brand', 'brand')
        .leftJoinAndSelect('p.stocks', 'stocks')
        .where('p.businessId = :businessId', { businessId });

      if (search) {
        qb.andWhere(
          '(p.name ILIKE :s OR p.sku ILIKE :s OR p.barcode ILIKE :s)',
          { s: `%${search}%` },
        );
      }
      if (categoryId) qb.andWhere('p.categoryId = :categoryId', { categoryId });
      if (brandId) qb.andWhere('p.brandId = :brandId', { brandId });

      qb.orderBy('p.name', 'ASC').skip(skip).take(limit);
      const [data, totalItems] = await qb.getManyAndCount();

      // Enrich each stock row with warehouseId from stock_locations
      const locationIds = new Set<string>();
      for (const p of data) {
        for (const s of p.stocks ?? []) locationIds.add(s.locationId);
      }

      if (locationIds.size > 0) {
        const locs = await this.dataSource
          .getRepository(StockLocationEntity)
          .createQueryBuilder('l')
          .where('l.id IN (:...ids)', { ids: [...locationIds] })
          .getMany();

        const locMap = new Map<string, string | null>(
          locs.map((l) => [l.id, l.warehouseId ?? null]),
        );
        for (const p of data) {
          for (const s of p.stocks ?? []) {
            (s as any).warehouseId = locMap.get(s.locationId) ?? null;
          }
        }
      }

      return {
        data,
        meta: {
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: Number(page),
          limit: Number(limit),
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to fetch products');
    }
  }

  // ─── findOne ──────────────────────────────────────────────────────────────

  async findOne(businessId: string, id: string) {
    try {
      const product = await this.productRepo.findOne({
        where: { id, businessId },
        relations: ['category', 'unit', 'brand', 'warranty'],
      });
      if (!product) throw new NotFoundException('Product not found');
      return product;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch product');
    }
  }

  // ─── getStock ─────────────────────────────────────────────────────────────

  async getStock(businessId: string, productId: string) {
    try {
      const rows = await this.stockRepo.find({
        where: { businessId, productId },
      });
      const total = rows.reduce((s, r) => s + Number(r.currentQty), 0);
      return { rows, total };
    } catch {
      throw new InternalServerErrorException('Failed to fetch stock');
    }
  }

  // ─── update ───────────────────────────────────────────────────────────────

  async update(businessId: string, id: string, dto: UpdateProductDto) {
    try {
      const product = await this.findOne(businessId, id);
      Object.assign(product, dto);
      return await this.productRepo.save(product);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to update product');
    }
  }

  // ─── remove ───────────────────────────────────────────────────────────────

  async remove(businessId: string, id: string) {
    try {
      const product = await this.findOne(businessId, id);

      const txCount = await this.ledgerRepo.count({
        where: {
          businessId,
          productId: id,
          transactionType: Not(StockTransactionType.OPENING),
        },
      });
      if (txCount > 0) {
        throw new BadRequestException(
          'Cannot delete a product that has transactions. Archive it by setting it inactive instead.',
        );
      }

      await this.productRepo.remove(product);
      return { message: 'Product deleted successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException('Failed to delete product');
    }
  }

  // ─── getLowStockProducts ──────────────────────────────────────────────────

  async getLowStockProducts(businessId: string) {
    try {
      return await this.dataSource.query(
        `SELECT p.*, ps."currentQty", ps.location_id
         FROM products p
         JOIN product_stocks ps ON ps.product_id = p.id AND ps.business_id = $1
         WHERE p.business_id = $1
           AND p."alertQuantity" IS NOT NULL
           AND ps."currentQty" <= p."alertQuantity"
         ORDER BY ps."currentQty" ASC
         LIMIT 50`,
        [businessId],
      );
    } catch {
      throw new InternalServerErrorException(
        'Failed to fetch low stock products',
      );
    }
  }

  // ─── getProductDetails ────────────────────────────────────────────────────

  async getProductDetails(businessId: string, productId: string) {
    try {
      const product = await this.productRepo.findOne({
        where: { id: productId, businessId },
        relations: ['category', 'unit', 'brand', 'warranty'],
      });
      if (!product) throw new NotFoundException('Product not found');

      const stockRows = await this.stockRepo.find({
        where: { businessId, productId },
      });
      const currentStock = stockRows.reduce(
        (s, r) => s + Number(r.currentQty),
        0,
      );
      const openingQtyFromStock = stockRows.reduce(
        (s, r) => s + Number(r.openingQty),
        0,
      );

      const [salesSummary] = await this.dataSource.query(
        `SELECT
           COUNT(DISTINCT si.sale_id)  AS total_orders,
           COALESCE(SUM(si.quantity),  0) AS total_qty_sold,
           COALESCE(SUM(si.total),     0) AS total_sales_amount,
           COALESCE(SUM(si.profit),    0) AS total_profit
         FROM sale_items si
         JOIN sales s ON s.id = si.sale_id
         WHERE si.product_id = $1
           AND s.business_id = $2
           AND s.status != 'cancelled'`,
        [productId, businessId],
      );

      const [purchaseSummary] = await this.dataSource.query(
        `SELECT
           COUNT(DISTINCT pi.purchase_id)  AS total_orders,
           COALESCE(SUM(pi.quantity),      0) AS total_qty_purchased,
           COALESCE(SUM(pi.total),         0) AS total_purchase_amount
         FROM purchase_items pi
         JOIN purchases p ON p.id = pi.purchase_id
         WHERE pi.product_id = $1
           AND p.business_id = $2
           AND p.status != 'cancelled'`,
        [productId, businessId],
      );

      const salesHistory = await this.dataSource.query(
        `SELECT
           s.id                AS sale_id,
           s."invoiceNo"       AS invoice_no,
           s."saleDate"        AS sale_date,
           s."paymentStatus"   AS payment_status,
           si.quantity,
           si."unitPrice"      AS unit_price,
           si."costPrice"      AS cost_price,
           si.total,
           si.profit,
           si."discountAmount" AS discount_amount,
           c.name              AS customer_name,
           c.phone             AS customer_phone,
           u.name              AS sold_by,
           u.email             AS sold_by_email
         FROM sale_items si
         JOIN sales s          ON s.id  = si.sale_id
         LEFT JOIN customers c ON c.id  = s.customer_id
         LEFT JOIN users u     ON u.id  = s."createdBy"::uuid
         WHERE si.product_id = $1
           AND s.business_id  = $2
           AND s.status       != 'cancelled'
         ORDER BY s."saleDate" DESC, s."createdAt" DESC
         LIMIT 200`,
        [productId, businessId],
      );

      const purchaseHistory = await this.dataSource.query(
        `SELECT
           p.id                 AS purchase_id,
           p."invoiceNo"        AS invoice_no,
           p."purchaseDate"     AS purchase_date,
           p."paymentStatus"    AS payment_status,
           pi.quantity,
           pi."unitCost"        AS unit_cost,
           pi.total,
           pi."discountAmount"  AS discount_amount,
           sp.name              AS supplier_name,
           sp.phone             AS supplier_phone,
           u.name               AS purchased_by,
           u.email              AS purchased_by_email
         FROM purchase_items pi
         JOIN purchases p        ON p.id  = pi.purchase_id
         LEFT JOIN suppliers sp  ON sp.id = p.supplier_id
         LEFT JOIN users u       ON u.id  = p."createdBy"::uuid
         WHERE pi.product_id = $1
           AND p.business_id  = $2
           AND p.status       != 'cancelled'
         ORDER BY p."purchaseDate" DESC, p."createdAt" DESC
         LIMIT 200`,
        [productId, businessId],
      );

      const ledger = await this.ledgerRepo.find({
        where: { businessId, productId },
        order: { createdAt: 'ASC' },
        take: 200,
      });

      return {
        product,
        stockSummary: {
          currentStock,
          openingStock: openingQtyFromStock || Number(product.openingStock),
          stockRows,
        },
        salesSummary,
        purchaseSummary,
        salesHistory,
        purchaseHistory,
        ledger,
      };
    } catch (error) {
      console.log(error, 'errorerror');

      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch product details');
    }
  }

  // ─── updateOpeningStock ───────────────────────────────────────────────────

  async updateOpeningStock(
    businessId: string,
    productId: string,
    newOpeningQty: number,
    userId: string,
  ) {
    const qr = this.createQueryRunner();
    await this.startTransaction(qr);

    try {
      // 1. Load product
      const product = await qr.manager.findOne(ProductEntity, {
        where: { id: productId, businessId },
      });
      if (!product) throw new NotFoundException('Product not found');

      // 2. Load primary stock row
      const stockRow = await qr.manager.findOne(ProductStockEntity, {
        where: { businessId, productId },
      });
      if (!stockRow) throw new NotFoundException('Stock record not found');

      const oldOpeningQty = Number(stockRow.openingQty);
      const diff = newOpeningQty - oldOpeningQty;

      // 3. Update product opening stock field
      product.openingStock = newOpeningQty;
      await qr.manager.save(ProductEntity, product);

      // 4. Update product_stocks row (adjust running totals by the diff)
      stockRow.openingQty = newOpeningQty;
      stockRow.inQty = Number(stockRow.inQty) + diff;
      stockRow.currentQty = Number(stockRow.currentQty) + diff;
      await qr.manager.save(ProductStockEntity, stockRow);

      // 5. Update or create the OPENING ledger entry
      const openingLedger = await qr.manager.findOne(StockLedgerEntity, {
        where: {
          businessId,
          productId,
          transactionType: StockTransactionType.OPENING,
        },
      });

      if (openingLedger) {
        openingLedger.qtyIn = newOpeningQty;
        openingLedger.balanceAfter = newOpeningQty;
        openingLedger.unitCost = Number(product.purchasePrice);
        openingLedger.totalCost = newOpeningQty * Number(product.purchasePrice);
        openingLedger.note = 'Opening stock (updated)';
        openingLedger.createdBy = userId;
        await qr.manager.save(StockLedgerEntity, openingLedger);
      } else if (newOpeningQty > 0) {
        const newEntry = qr.manager.create(StockLedgerEntity, {
          businessId,
          productId,
          locationId: stockRow.locationId,
          transactionType: StockTransactionType.OPENING,
          qtyIn: newOpeningQty,
          qtyOut: 0,
          balanceAfter: newOpeningQty,
          unitCost: Number(product.purchasePrice),
          totalCost: newOpeningQty * Number(product.purchasePrice),
          note: 'Opening stock',
          createdBy: userId,
        });
        await qr.manager.save(StockLedgerEntity, newEntry);
      }

      await qr.commitTransaction();
      return { message: 'Opening stock updated successfully', newOpeningQty };
    } catch (error) {
      await qr.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException('Failed to update opening stock');
    } finally {
      await qr.release();
    }
  }
}
