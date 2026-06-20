import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { ProductEntity } from '../entities/product.entity';
import { CategoryEntity } from '../../category/entities/category.entity';
import { UnitEntity } from '../../unit/entities/unit.entity';
import { BrandEntity } from '../../brand/entities/brand.entity';
import { ProductService } from './product.service';

const COLUMNS = [
  'name',
  'sku',
  'barcode',
  'productType',
  'description',
  'purchasePrice',
  'sellingPrice',
  'wholesalePrice',
  'openingStock',
  'alertQuantity',
  'categoryName',
  'unitName',
  'brandName',
];

@Injectable()
export class ProductImportExportService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
    @InjectRepository(UnitEntity)
    private readonly unitRepo: Repository<UnitEntity>,
    @InjectRepository(BrandEntity)
    private readonly brandRepo: Repository<BrandEntity>,
    private readonly productService: ProductService,
  ) {}

  getTemplate(): Buffer {
    const sample = [
      {
        name: 'Sample Product',
        sku: 'SP001',
        barcode: '1234567890',
        productType: 'physical',
        description: 'Sample description',
        purchasePrice: 100,
        sellingPrice: 150,
        wholesalePrice: 130,
        openingStock: 50,
        alertQuantity: 10,
        categoryName: 'Electronics',
        unitName: 'Piece',
        brandName: 'Samsung',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample, { header: COLUMNS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async exportProducts(businessId: string): Promise<Buffer> {
    const products = await this.productRepo.find({
      where: { businessId },
      relations: ['category', 'unit', 'brand'],
      order: { name: 'ASC' },
    });

    const rows = products.map((p) => ({
      name: p.name,
      sku: p.sku ?? '',
      barcode: p.barcode ?? '',
      productType: p.productType,
      description: p.description ?? '',
      purchasePrice: Number(p.purchasePrice),
      sellingPrice: Number(p.sellingPrice),
      wholesalePrice: p.wholesalePrice != null ? Number(p.wholesalePrice) : '',
      openingStock: Number(p.openingStock),
      alertQuantity: p.alertQuantity != null ? Number(p.alertQuantity) : '',
      categoryName: p.category?.name ?? '',
      unitName: p.unit?.name ?? '',
      brandName: p.brand?.name ?? '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows, { header: COLUMNS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async importProducts(
    businessId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ success: number; failed: number; errors: { row: number; message: string }[] }> {
    if (!file?.buffer) throw new BadRequestException('File is required');

    const wb = XLSX.read(file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (!rows.length) throw new BadRequestException('The file contains no data rows');

    const [categories, units, brands] = await Promise.all([
      this.categoryRepo.find({ where: { businessId } }),
      this.unitRepo.find({ where: { businessId } }),
      this.brandRepo.find({ where: { businessId } }),
    ]);

    const catMap = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c.id]));
    const unitMap = new Map(units.map((u) => [u.name.trim().toLowerCase(), u.id]));
    const brandMap = new Map(brands.map((b) => [b.name.trim().toLowerCase(), b.id]));

    const results = { success: 0, failed: 0, errors: [] as { row: number; message: string }[] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        const name = String(row.name ?? '').trim();
        if (!name) throw new Error('Product name is required');

        const productType = String(row.productType ?? 'physical').trim().toLowerCase();
        if (!['physical', 'digital', 'service'].includes(productType)) {
          throw new Error('productType must be physical, digital, or service');
        }

        const dto: any = {
          name,
          sku: row.sku !== '' ? String(row.sku).trim() : undefined,
          barcode: row.barcode !== '' ? String(row.barcode).trim() : undefined,
          productType,
          description: row.description !== '' ? String(row.description).trim() : undefined,
          purchasePrice: row.purchasePrice !== '' ? Number(row.purchasePrice) : 0,
          sellingPrice: row.sellingPrice !== '' ? Number(row.sellingPrice) : 0,
          wholesalePrice: row.wholesalePrice !== '' ? Number(row.wholesalePrice) : undefined,
          openingStock: row.openingStock !== '' ? Number(row.openingStock) : 0,
          alertQuantity: row.alertQuantity !== '' ? Number(row.alertQuantity) : undefined,
        };

        if (isNaN(dto.purchasePrice) || isNaN(dto.sellingPrice) || isNaN(dto.openingStock)) {
          throw new Error('Price and stock values must be valid numbers');
        }

        if (row.categoryName) {
          const key = String(row.categoryName).trim().toLowerCase();
          let id = catMap.get(key);
          if (!id) {
            const created = await this.categoryRepo.save(
              this.categoryRepo.create({ name: String(row.categoryName).trim(), businessId }),
            );
            id = created.id;
            catMap.set(key, id);
          }
          dto.categoryId = id;
        }
        if (row.unitName) {
          const key = String(row.unitName).trim().toLowerCase();
          let id = unitMap.get(key);
          if (!id) {
            const created = await this.unitRepo.save(
              this.unitRepo.create({ name: String(row.unitName).trim(), businessId }),
            );
            id = created.id;
            unitMap.set(key, id);
          }
          dto.unitId = id;
        }
        if (row.brandName) {
          const key = String(row.brandName).trim().toLowerCase();
          let id = brandMap.get(key);
          if (!id) {
            const created = await this.brandRepo.save(
              this.brandRepo.create({ name: String(row.brandName).trim(), businessId }),
            );
            id = created.id;
            brandMap.set(key, id);
          }
          dto.brandId = id;
        }

        await this.productService.create(businessId, userId, dto);
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({ row: rowNum, message: err.message ?? 'Unknown error' });
      }
    }

    return results;
  }
}
