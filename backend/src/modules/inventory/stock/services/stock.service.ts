import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StockAdjustmentEntity, AdjustmentType } from '../entities/stock-adjustment.entity';
import { StockTransferEntity, TransferStatus } from '../entities/stock-transfer.entity';
import { ProductStockEntity } from '../../product/entities/product-stock.entity';
import { StockLedgerEntity, StockTransactionType } from '../../product/entities/stock-ledger.entity';
import { StockLocationEntity } from '../../warehouse/entities/stock-location.entity';
import { StockLocationService } from '../../warehouse/services/stock-location.service';
import {
  CreateAdjustmentDto,
  CreateTransferDto,
  GetAdjustmentsDto,
  GetStockLedgerDto,
  GetTransfersDto,
} from '../dto/stock.dto';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockAdjustmentEntity)
    private readonly adjustmentRepo: Repository<StockAdjustmentEntity>,
    @InjectRepository(StockTransferEntity)
    private readonly transferRepo: Repository<StockTransferEntity>,
    @InjectRepository(ProductStockEntity)
    private readonly stockRepo: Repository<ProductStockEntity>,
    @InjectRepository(StockLedgerEntity)
    private readonly ledgerRepo: Repository<StockLedgerEntity>,
    private readonly locationService: StockLocationService,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Helper: get or create stock row for a product at a location ────────────
  private async getOrCreateStock(
    businessId: string,
    locationId: string,
    productId: string,
    tx: any,
  ): Promise<ProductStockEntity> {
    let stock = await tx.findOne(ProductStockEntity, {
      where: { businessId, locationId, productId },
    });
    if (!stock) {
      stock = tx.create(ProductStockEntity, {
        businessId,
        locationId,
        productId,
        openingQty: 0,
        inQty: 0,
        outQty: 0,
        currentQty: 0,
        reservedQty: 0,
        avgCost: 0,
        isActive: true,
      });
      await tx.save(ProductStockEntity, stock);
    }
    return stock;
  }

  // ─── ADJUSTMENTS ────────────────────────────────────────────────────────────

  async createAdjustment(businessId: string, userId: string, dto: CreateAdjustmentDto) {
    return this.dataSource.transaction(async (tx) => {
      // Resolve location — defaults to business-level if warehouseId omitted
      const location = await this.locationService.resolve(businessId, dto.warehouseId, tx);

      const stock = await this.getOrCreateStock(businessId, location.id, dto.productId, tx);
      const before = Number(stock.currentQty);
      const qty = Number(dto.quantity);
      const isIn = dto.type === AdjustmentType.ADD || dto.type === AdjustmentType.LOST === false;
      const isDeduction = dto.type === AdjustmentType.REMOVE
        || dto.type === AdjustmentType.DAMAGED
        || dto.type === AdjustmentType.LOST;

      if (isDeduction && qty > before) {
        throw new BadRequestException(`Insufficient stock. Available: ${before}`);
      }

      const after = isDeduction ? before - qty : before + qty;

      if (isDeduction) {
        stock.outQty = Number(stock.outQty) + qty;
      } else {
        stock.inQty = Number(stock.inQty) + qty;
      }
      stock.currentQty = after;
      await tx.save(ProductStockEntity, stock);

      const adjustment = tx.create(StockAdjustmentEntity, {
        businessId,
        locationId: location.id,
        productId: dto.productId,
        type: dto.type,
        quantity: qty,
        reason: dto.reason,
        note: dto.note,
        adjustedBy: userId,
        balanceBefore: before,
        balanceAfter: after,
      });
      const saved = await tx.save(StockAdjustmentEntity, adjustment);

      const txType = isDeduction
        ? (dto.type === AdjustmentType.DAMAGED ? StockTransactionType.DAMAGED
          : dto.type === AdjustmentType.LOST ? StockTransactionType.LOST
          : StockTransactionType.ADJUSTMENT_OUT)
        : StockTransactionType.ADJUSTMENT_IN;

      await tx.save(StockLedgerEntity, {
        businessId,
        productId: dto.productId,
        locationId: location.id,
        transactionType: txType,
        referenceType: 'adjustment',
        referenceId: saved.id,
        qtyIn: isDeduction ? 0 : qty,
        qtyOut: isDeduction ? qty : 0,
        balanceAfter: after,
        note: dto.reason || dto.note,
        createdBy: userId,
      });

      return { ...saved, location };
    });
  }

  async getAdjustments(businessId: string, query: GetAdjustmentsDto) {
    const { page = 1, limit = 10, locationId, productId } = query;
    const where: any = { businessId };
    if (locationId) where.locationId = locationId;
    if (productId) where.productId = productId;

    const [data, totalItems] = await this.adjustmentRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  // ─── TRANSFERS ───────────────────────────────────────────────────────────────

  async createTransfer(businessId: string, userId: string, dto: CreateTransferDto) {
    // Resolve from/to locations
    let fromLocation: StockLocationEntity;
    let toLocation: StockLocationEntity;

    if (dto.fromLocationId) {
      fromLocation = await this.locationService.findOne(businessId, dto.fromLocationId)
        ?? await this.locationService.resolveDefault(businessId);
    } else {
      fromLocation = await this.locationService.resolve(businessId, dto.fromWarehouseId);
    }

    if (dto.toLocationId) {
      toLocation = await this.locationService.findOne(businessId, dto.toLocationId)
        ?? await this.locationService.resolveDefault(businessId);
    } else {
      toLocation = await this.locationService.resolve(businessId, dto.toWarehouseId);
    }

    if (fromLocation.id === toLocation.id) {
      throw new BadRequestException('Source and destination must be different locations');
    }

    // Validate source has enough stock
    const fromStock = await this.stockRepo.findOne({
      where: { businessId, productId: dto.productId, locationId: fromLocation.id },
    });
    if (!fromStock || Number(fromStock.currentQty) < Number(dto.quantity)) {
      throw new BadRequestException(
        `Insufficient stock at "${fromLocation.name}". Available: ${fromStock?.currentQty ?? 0}`,
      );
    }

    const transfer = this.transferRepo.create({
      businessId,
      productId: dto.productId,
      fromLocationId: fromLocation.id,
      toLocationId: toLocation.id,
      quantity: dto.quantity,
      note: dto.note,
      status: TransferStatus.PENDING,
      createdBy: userId,
    });
    return this.transferRepo.save(transfer);
  }

  async approveTransfer(businessId: string, id: string, userId: string) {
    return this.dataSource.transaction(async (tx) => {
      const transfer = await tx.findOne(StockTransferEntity, {
        where: { id, businessId, status: TransferStatus.PENDING },
      });
      if (!transfer) throw new NotFoundException('Transfer not found or already processed');

      // Deduct from source
      const fromStock = await this.getOrCreateStock(businessId, transfer.fromLocationId, transfer.productId, tx);
      const fromBefore = Number(fromStock.currentQty);
      if (fromBefore < Number(transfer.quantity)) {
        throw new BadRequestException('Insufficient stock in source location');
      }
      fromStock.currentQty = fromBefore - Number(transfer.quantity);
      fromStock.outQty = Number(fromStock.outQty) + Number(transfer.quantity);
      await tx.save(ProductStockEntity, fromStock);

      // Add to destination
      const toStock = await this.getOrCreateStock(businessId, transfer.toLocationId, transfer.productId, tx);
      const toBefore = Number(toStock.currentQty);
      toStock.currentQty = toBefore + Number(transfer.quantity);
      toStock.inQty = Number(toStock.inQty) + Number(transfer.quantity);
      await tx.save(ProductStockEntity, toStock);

      // Ledger entries
      await tx.save(StockLedgerEntity, {
        businessId,
        productId: transfer.productId,
        locationId: transfer.fromLocationId,
        transactionType: StockTransactionType.TRANSFER_OUT,
        referenceType: 'transfer',
        referenceId: transfer.id,
        qtyIn: 0,
        qtyOut: transfer.quantity,
        balanceAfter: fromStock.currentQty,
        createdBy: userId,
      });
      await tx.save(StockLedgerEntity, {
        businessId,
        productId: transfer.productId,
        locationId: transfer.toLocationId,
        transactionType: StockTransactionType.TRANSFER_IN,
        referenceType: 'transfer',
        referenceId: transfer.id,
        qtyIn: transfer.quantity,
        qtyOut: 0,
        balanceAfter: toStock.currentQty,
        createdBy: userId,
      });

      transfer.status = TransferStatus.APPROVED;
      transfer.approvedBy = userId;
      return tx.save(StockTransferEntity, transfer);
    });
  }

  async cancelTransfer(businessId: string, id: string) {
    const transfer = await this.transferRepo.findOne({
      where: { id, businessId, status: TransferStatus.PENDING },
    });
    if (!transfer) throw new NotFoundException('Transfer not found or already processed');
    transfer.status = TransferStatus.CANCELLED;
    return this.transferRepo.save(transfer);
  }

  async getTransfers(businessId: string, query: GetTransfersDto) {
    const { page = 1, limit = 10, locationId } = query;
    const qb = this.transferRepo
      .createQueryBuilder('t')
      .where('t.businessId = :businessId', { businessId });

    if (locationId) {
      qb.andWhere('(t.fromLocationId = :loc OR t.toLocationId = :loc)', { loc: locationId });
    }

    qb.orderBy('t.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, totalItems] = await qb.getManyAndCount();
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  // ─── LEDGER ──────────────────────────────────────────────────────────────────

  async getLedger(businessId: string, query: GetStockLedgerDto) {
    const { page = 1, limit = 20, productId, locationId, transactionType, dateFrom, dateTo } = query;

    const qb = this.ledgerRepo
      .createQueryBuilder('sl')
      .where('sl.businessId = :businessId', { businessId });

    if (productId) qb.andWhere('sl.productId = :productId', { productId });
    if (locationId) qb.andWhere('sl.locationId = :locationId', { locationId });
    if (transactionType) qb.andWhere('sl.transactionType = :transactionType', { transactionType });
    if (dateFrom) qb.andWhere('sl.createdAt >= :dateFrom', { dateFrom: new Date(dateFrom) });
    if (dateTo) qb.andWhere('sl.createdAt <= :dateTo', { dateTo: new Date(dateTo) });

    qb.orderBy('sl.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, totalItems] = await qb.getManyAndCount();
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  // ─── CURRENT STOCK ───────────────────────────────────────────────────────────

  async getCurrentStock(businessId: string, productId: string, locationId?: string) {
    const where: any = { businessId, productId };
    if (locationId) where.locationId = locationId;
    const rows = await this.stockRepo.find({ where });
    const total = rows.reduce((s, r) => s + Number(r.currentQty), 0);
    return { rows, total };
  }
}
