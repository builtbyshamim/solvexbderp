import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from '../entities/product.entity';
import { ProductStockEntity } from '../entities/product-stock.entity';
import { StockLedgerEntity, StockTransactionType } from '../entities/stock-ledger.entity';
import { CreateProductDto, GetProductsDto, UpdateProductDto } from '../dto/product.dto';
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

  async create(businessId: string, userId: string, dto: CreateProductDto) {
    return this.dataSource.transaction(async (tx) => {
      if (dto.sku) {
        const exists = await tx.findOne(ProductEntity, { where: { businessId, sku: dto.sku } });
        if (exists) throw new ConflictException('SKU already exists in this business');
      }

      const product = tx.create(ProductEntity, {
        ...dto,
        businessId,
        openingStock: dto.openingStock ?? 0,
        purchasePrice: dto.purchasePrice ?? 0,
        sellingPrice: dto.sellingPrice ?? 0,
      });
      const saved = await tx.save(ProductEntity, product);

      // Resolve location: warehouseId provided → warehouse location, else → business default
      const location = await this.locationService.resolve(businessId, dto.warehouseId, tx);
      const openingQty = dto.openingStock ?? 0;

      const stock = tx.create(ProductStockEntity, {
        businessId,
        productId: saved.id,
        locationId: location.id,
        openingQty,
        inQty: openingQty,
        outQty: 0,
        currentQty: openingQty,
        reservedQty: 0,
        avgCost: dto.purchasePrice ?? 0,
      });
      await tx.save(ProductStockEntity, stock);

      if (openingQty > 0) {
        await tx.save(StockLedgerEntity, {
          businessId,
          productId: saved.id,
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
      }

      return saved;
    });
  }

  async findAll(businessId: string, query: GetProductsDto) {
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
      qb.andWhere('(p.name ILIKE :s OR p.sku ILIKE :s OR p.barcode ILIKE :s)', { s: `%${search}%` });
    }
    if (categoryId) qb.andWhere('p.categoryId = :categoryId', { categoryId });
    if (brandId) qb.andWhere('p.brandId = :brandId', { brandId });

    qb.orderBy('p.name', 'ASC').skip(skip).take(limit);
    const [data, totalItems] = await qb.getManyAndCount();

    // Enrich each stock row with warehouseId from stock_locations
    // so the frontend can match stocks to the active warehouse
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
      const locMap = new Map<string, string | null>(locs.map((l) => [l.id, l.warehouseId ?? null]));
      for (const p of data) {
        for (const s of p.stocks ?? []) {
          (s as any).warehouseId = locMap.get(s.locationId) ?? null;
        }
      }
    }

    return {
      data,
      meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page), limit: Number(limit) },
    };
  }

  async findOne(businessId: string, id: string) {
    const product = await this.productRepo.findOne({
      where: { id, businessId },
      relations: ['category', 'unit', 'brand', 'warranty'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async getStock(businessId: string, productId: string) {
    // Return stock rows with computed total
    const rows = await this.stockRepo.find({ where: { businessId, productId } });
    const total = rows.reduce((s, r) => s + Number(r.currentQty), 0);
    return { rows, total };
  }

  async update(businessId: string, id: string, dto: UpdateProductDto) {
    const product = await this.findOne(businessId, id);
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async remove(businessId: string, id: string) {
    const product = await this.findOne(businessId, id);
    await this.productRepo.remove(product);
    return { message: 'Product deleted successfully' };
  }

  async getLowStockProducts(businessId: string) {
    return this.dataSource.query(
      `SELECT p.*, ps.current_qty, ps.location_id
       FROM products p
       JOIN product_stocks ps ON ps.product_id = p.id AND ps.business_id = $1
       WHERE p.business_id = $1
         AND p.alert_quantity IS NOT NULL
         AND ps.current_qty <= p.alert_quantity
       ORDER BY ps.current_qty ASC
       LIMIT 50`,
      [businessId],
    );
  }
}
