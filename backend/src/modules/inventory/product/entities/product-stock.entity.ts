import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';
import { ProductEntity } from './product.entity';
import { WarehouseEntity } from '../../warehouse/entities/warehouse.entity';

@Entity('product_stocks')
@Index(['businessId', 'productId', 'warehouseId'], { unique: true })
export class ProductStockEntity extends TenantBaseEntity {
  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => ProductEntity, (p) => p.stocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column({ name: 'warehouse_id' })
  warehouseId: string;

  @ManyToOne(() => WarehouseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: WarehouseEntity;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  openingQty: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  inQty: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  outQty: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  currentQty: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  avgCost: number;
}
