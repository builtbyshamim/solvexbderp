import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StockAdjustmentEntity, AdjustmentType } from '../entities/stock-adjustment.entity';
import { StockTransferEntity, TransferStatus } from '../entities/stock-transfer.entity';
import { ProductStockEntity } from '../../product/entities/product-stock.entity';
import { StockLedgerEntity, StockTransactionType } from '../../product/entities/stock-ledger.entity';
import { CreateAdjustmentDto, CreateTransferDto, GetStockLedgerDto } from '../dto/stock.dto';

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
    private readonly dataSource: DataSource,
  ) {}

  async createAdjustment(businessId: string, userId: string, dto: CreateAdjustmentDto) {
    return this.dataSource.transaction(async (tx) => {
      const stock = await tx.findOne(ProductStockEntity, {
        where: { businessId, productId: dto.productId, warehouseId: dto.warehouseId },
      });

      if (!stock) throw new NotFoundException('Stock record not found for this product/warehouse');

      const before = Number(stock.currentQty);
      let after: number;

      if (dto.type === AdjustmentType.ADD) {
        after = before + Number(dto.quantity);
        stock.inQty = Number(stock.inQty) + Number(dto.quantity);
      } else {
        if (Number(dto.quantity) > before) {
          throw new BadRequestException(`Insufficient stock. Available: ${before}`);
        }
        after = before - Number(dto.quantity);
        stock.outQty = Number(stock.outQty) + Number(dto.quantity);
      }

      stock.currentQty = after;
      await tx.save(ProductStockEntity, stock);

      const adjustment = tx.create(StockAdjustmentEntity, {
        businessId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        type: dto.type,
        quantity: dto.quantity,
        reason: dto.reason,
        note: dto.note,
        adjustedBy: userId,
        balanceBefore: before,
        balanceAfter: after,
      });
      const saved = await tx.save(StockAdjustmentEntity, adjustment);

      await tx.save(StockLedgerEntity, {
        businessId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        transactionType: dto.type === AdjustmentType.ADD
          ? StockTransactionType.ADJUSTMENT_IN
          : StockTransactionType.ADJUSTMENT_OUT,
        referenceType: 'adjustment',
        referenceId: saved.id,
        qtyIn: dto.type === AdjustmentType.ADD ? dto.quantity : 0,
        qtyOut: dto.type === AdjustmentType.REMOVE ? dto.quantity : 0,
        balanceAfter: after,
        note: dto.reason || dto.note,
        createdBy: userId,
      });

      return saved;
    });
  }

  async getAdjustments(businessId: string, page = 1, limit = 10) {
    const [data, totalItems] = await this.adjustmentRepo.findAndCount({
      where: { businessId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit) } };
  }

  async createTransfer(businessId: string, userId: string, dto: CreateTransferDto) {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException('Source and destination warehouse must be different');
    }

    const stock = await this.stockRepo.findOne({
      where: { businessId, productId: dto.productId, warehouseId: dto.fromWarehouseId },
    });
    if (!stock || Number(stock.currentQty) < Number(dto.quantity)) {
      throw new BadRequestException(`Insufficient stock. Available: ${stock?.currentQty ?? 0}`);
    }

    const transfer = this.transferRepo.create({
      businessId,
      productId: dto.productId,
      fromWarehouseId: dto.fromWarehouseId,
      toWarehouseId: dto.toWarehouseId,
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
      const fromStock = await tx.findOne(ProductStockEntity, {
        where: { businessId, productId: transfer.productId, warehouseId: transfer.fromWarehouseId },
      });
      if (!fromStock || Number(fromStock.currentQty) < Number(transfer.quantity)) {
        throw new BadRequestException('Insufficient stock in source warehouse');
      }
      const fromBefore = Number(fromStock.currentQty);
      fromStock.currentQty = fromBefore - Number(transfer.quantity);
      fromStock.outQty = Number(fromStock.outQty) + Number(transfer.quantity);
      await tx.save(ProductStockEntity, fromStock);

      // Add to destination (create if not exists)
      let toStock = await tx.findOne(ProductStockEntity, {
        where: { businessId, productId: transfer.productId, warehouseId: transfer.toWarehouseId },
      });
      if (!toStock) {
        toStock = tx.create(ProductStockEntity, {
          businessId,
          productId: transfer.productId,
          warehouseId: transfer.toWarehouseId,
          openingQty: 0, inQty: 0, outQty: 0, currentQty: 0, avgCost: fromStock.avgCost,
        });
      }
      const toBefore = Number(toStock.currentQty);
      toStock.currentQty = toBefore + Number(transfer.quantity);
      toStock.inQty = Number(toStock.inQty) + Number(transfer.quantity);
      await tx.save(ProductStockEntity, toStock);

      // Ledger entries
      await tx.save(StockLedgerEntity, {
        businessId,
        productId: transfer.productId,
        warehouseId: transfer.fromWarehouseId,
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
        warehouseId: transfer.toWarehouseId,
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
      await tx.save(StockTransferEntity, transfer);

      return transfer;
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

  async getTransfers(businessId: string, page = 1, limit = 10) {
    const [data, totalItems] = await this.transferRepo.findAndCount({
      where: { businessId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit) } };
  }

  async getLedger(businessId: string, query: GetStockLedgerDto) {
    const { page = 1, limit = 20, productId, warehouseId, transactionType, dateFrom, dateTo } = query;

    const qb = this.ledgerRepo
      .createQueryBuilder('sl')
      .where('sl.businessId = :businessId', { businessId });

    if (productId) qb.andWhere('sl.productId = :productId', { productId });
    if (warehouseId) qb.andWhere('sl.warehouseId = :warehouseId', { warehouseId });
    if (transactionType) qb.andWhere('sl.transactionType = :transactionType', { transactionType });
    if (dateFrom) qb.andWhere('sl.createdAt >= :dateFrom', { dateFrom: new Date(dateFrom) });
    if (dateTo) qb.andWhere('sl.createdAt <= :dateTo', { dateTo: new Date(dateTo) });

    qb.orderBy('sl.createdAt', 'DESC').skip((page - 1) * limit).take(limit);

    const [data, totalItems] = await qb.getManyAndCount();
    return {
      data,
      meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) },
    };
  }
}
