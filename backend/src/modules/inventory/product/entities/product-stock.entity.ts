import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';
import { ProductEntity } from './product.entity';

@Entity('product_stocks')
@Index(['businessId', 'locationId', 'productId'], { unique: true })
@Index(['businessId', 'productId'])
export class ProductStockEntity extends TenantBaseEntity {
  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => ProductEntity, (p) => p.stocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  /**
   * References stock_locations.id (not warehouse_id directly).
   * null is not allowed — every stock row belongs to a location.
   * Use the business-default location when no warehouse is specified.
   */
  @Column({ name: 'location_id' })
  locationId: string;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  openingQty: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  inQty: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  outQty: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  currentQty: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  reservedQty: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  avgCost: number;
}
