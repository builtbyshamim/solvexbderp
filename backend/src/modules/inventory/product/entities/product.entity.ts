import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';
import { CategoryEntity } from '../../category/entities/category.entity';
import { UnitEntity } from '../../unit/entities/unit.entity';
import { BrandEntity } from '../../brand/entities/brand.entity';
import { WarrantyEntity } from '../../warranty/entities/warranty.entity';
import { ProductStockEntity } from './product-stock.entity';

export enum ProductType {
  PHYSICAL = 'physical',
  DIGITAL  = 'digital',
  SERVICE  = 'service',
}

@Entity('products')
@Index(['businessId', 'name'])
@Index(['businessId', 'sku'], { unique: true, where: '"sku" IS NOT NULL' })
export class ProductEntity extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true, unique: false })
  sku?: string;

  @Column({ nullable: true })
  barcode?: string;

  @Column({ type: 'enum', enum: ProductType, default: ProductType.PHYSICAL })
  productType: ProductType;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  purchasePrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  sellingPrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  wholesalePrice?: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  openingStock: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  alertQuantity?: number;

  @Column({ nullable: true, name: 'category_id' })
  categoryId?: string;

  @ManyToOne(() => CategoryEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: CategoryEntity;

  @Column({ nullable: true, name: 'unit_id' })
  unitId?: string;

  @ManyToOne(() => UnitEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'unit_id' })
  unit?: UnitEntity;

  @Column({ nullable: true, name: 'brand_id' })
  brandId?: string;

  @ManyToOne(() => BrandEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brand_id' })
  brand?: BrandEntity;

  @Column({ nullable: true, name: 'warranty_id' })
  warrantyId?: string;

  @ManyToOne(() => WarrantyEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'warranty_id' })
  warranty?: WarrantyEntity;

  @OneToMany(() => ProductStockEntity, (stock) => stock.product)
  stocks: ProductStockEntity[];
}
