import { Entity, Column, Index, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

export enum LocationType {
  BUSINESS  = 'business',   // default — no physical warehouse, belongs to business
  WAREHOUSE = 'warehouse',  // tied to a specific warehouse
}

@Entity('stock_locations')
@Index(['businessId', 'isDefault'])
@Index(['businessId', 'warehouseId'])
export class StockLocationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  /**
   * null  → business-level default location
   * uuid  → tied to a specific WarehouseEntity
   */
  @Column({ name: 'warehouse_id', nullable: true, type: 'uuid' })
  warehouseId?: string | null;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: LocationType, default: LocationType.BUSINESS })
  type: LocationType;

  /** Only one default per business (the BUSINESS-type location) */
  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
