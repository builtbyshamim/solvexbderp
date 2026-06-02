import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { StockLocationEntity, LocationType } from '../entities/stock-location.entity';
import { WarehouseEntity } from '../entities/warehouse.entity';

@Injectable()
export class StockLocationService {
  constructor(
    @InjectRepository(StockLocationEntity)
    private readonly repo: Repository<StockLocationEntity>,
  ) {}

  /**
   * Get or lazily create the business-level default location.
   * Called the first time any stock operation happens for a business.
   */
  async resolveDefault(businessId: string, tx?: EntityManager): Promise<StockLocationEntity> {
    const em = tx ?? this.repo.manager;
    let loc = await em.findOne(StockLocationEntity, {
      where: { businessId, isDefault: true },
    });
    if (!loc) {
      loc = em.create(StockLocationEntity, {
        businessId,
        warehouseId: null,
        name: 'Business Default',
        type: LocationType.BUSINESS,
        isDefault: true,
        isActive: true,
      });
      await em.save(StockLocationEntity, loc);
    }
    return loc;
  }

  /**
   * Main resolver used by every stock operation:
   *  - warehouseId provided → return that warehouse's location
   *  - warehouseId omitted   → return (or create) the business default
   */
  async resolve(businessId: string, warehouseId?: string | null, tx?: EntityManager): Promise<StockLocationEntity> {
    const em = tx ?? this.repo.manager;
    if (warehouseId) {
      const loc = await em.findOne(StockLocationEntity, {
        where: { businessId, warehouseId },
      });
      if (loc) return loc;
      // warehouse exists but location missing — create lazily
      const loc2 = em.create(StockLocationEntity, {
        businessId,
        warehouseId,
        name: `Warehouse (${warehouseId.slice(0, 8)})`,
        type: LocationType.WAREHOUSE,
        isDefault: false,
        isActive: true,
      });
      return em.save(StockLocationEntity, loc2);
    }
    return this.resolveDefault(businessId, tx);
  }

  /** Called after a warehouse is created */
  async createForWarehouse(warehouse: WarehouseEntity, tx?: EntityManager): Promise<StockLocationEntity> {
    const em = tx ?? this.repo.manager;
    const existing = await em.findOne(StockLocationEntity, {
      where: { businessId: warehouse.businessId, warehouseId: warehouse.id },
    });
    if (existing) return existing;
    const loc = em.create(StockLocationEntity, {
      businessId: warehouse.businessId,
      warehouseId: warehouse.id,
      name: warehouse.name,
      type: LocationType.WAREHOUSE,
      isDefault: false,
      isActive: true,
    });
    return em.save(StockLocationEntity, loc);
  }

  /** Keep location name in sync when warehouse is renamed */
  async syncWarehouseName(businessId: string, warehouseId: string, name: string): Promise<void> {
    await this.repo.update({ businessId, warehouseId }, { name });
  }

  /** Called when a warehouse is deleted */
  async deleteForWarehouse(businessId: string, warehouseId: string): Promise<void> {
    await this.repo.delete({ businessId, warehouseId });
  }

  /** List all active locations for a business (default first, then warehouses) */
  async findAllByBusiness(businessId: string): Promise<StockLocationEntity[]> {
    return this.repo.find({
      where: { businessId, isActive: true },
      order: { isDefault: 'DESC', name: 'ASC' },
    });
  }

  async findOne(businessId: string, id: string): Promise<StockLocationEntity | null> {
    return this.repo.findOne({ where: { id, businessId } });
  }
}
