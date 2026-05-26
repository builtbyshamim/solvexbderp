import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from '../entities/product.entity';
import { ProductStockEntity } from '../entities/product-stock.entity';
import { StockLedgerEntity, StockTransactionType } from '../entities/stock-ledger.entity';
import { CreateProductDto, GetProductsDto, UpdateProductDto } from '../dto/product.dto';
import { WarehouseService } from '../../warehouse/services/warehouse.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(ProductStockEntity)
    private readonly stockRepo: Repository<ProductStockEntity>,
    @InjectRepository(StockLedgerEntity)
    private readonly ledgerRepo: Repository<StockLedgerEntity>,
    private readonly warehouseService: WarehouseService,
    private readonly dataSource: DataSource,
  ) {}

  async create(businessId: string, userId: string, dto: CreateProductDto) {
    return this.dataSource.transaction(async (tx) => {
      // SKU uniqueness check within business
      if (dto.sku) {
        const exists = await tx.findOne(ProductEntity, {
          where: { businessId, sku: dto.sku },
        });
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

      // Determine warehouse
      const warehouseId = dto.warehouseId
        ?? (await this.warehouseService.getDefault(businessId))?.id;

      if (warehouseId && (dto.openingStock ?? 0) > 0) {
        // Create stock record
        const stock = tx.create(ProductStockEntity, {
          businessId,
          productId: saved.id,
          warehouseId,
          openingQty: dto.openingStock,
          inQty: dto.openingStock,
          outQty: 0,
          currentQty: dto.openingStock,
          avgCost: dto.purchasePrice ?? 0,
        });
        await tx.save(ProductStockEntity, stock);

        // Write to stock ledger
        await tx.save(StockLedgerEntity, {
          businessId,
          productId: saved.id,
          warehouseId,
          transactionType: StockTransactionType.OPENING,
          qtyIn: dto.openingStock,
          qtyOut: 0,
          balanceAfter: dto.openingStock,
          unitCost: dto.purchasePrice ?? 0,
          note: 'Opening stock',
          createdBy: userId,
        });
      } else if (warehouseId) {
        // Zero opening stock — still create record
        const stock = tx.create(ProductStockEntity, {
          businessId,
          productId: saved.id,
          warehouseId,
          openingQty: 0,
          inQty: 0,
          outQty: 0,
          currentQty: 0,
          avgCost: dto.purchasePrice ?? 0,
        });
        await tx.save(ProductStockEntity, stock);
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
      qb.andWhere('(p.name ILIKE :s OR p.sku ILIKE :s OR p.barcode ILIKE :s)', {
        s: `%${search}%`,
      });
    }
    if (categoryId) qb.andWhere('p.categoryId = :categoryId', { categoryId });
    if (brandId) qb.andWhere('p.brandId = :brandId', { brandId });

    qb.orderBy('p.name', 'ASC').skip(skip).take(limit);

    const [data, totalItems] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: Number(page),
        limit: Number(limit),
      },
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
    return this.stockRepo.find({
      where: { businessId, productId },
      relations: ['warehouse'],
    });
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
      `SELECT p.*, ps.current_qty, ps.warehouse_id
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
