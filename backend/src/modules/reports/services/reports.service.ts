import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleEntity } from 'src/modules/sales/entities/sale.entity';
import { PurchaseEntity } from 'src/modules/purchase/entities/purchase.entity';
import { ProductStockEntity } from 'src/modules/inventory/product/entities/product-stock.entity';
import { CustomerEntity } from 'src/modules/sales/entities/customer.entity';
import { SupplierEntity } from 'src/modules/purchase/entities/supplier.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(SaleEntity)
    private readonly saleRepo: Repository<SaleEntity>,
    @InjectRepository(PurchaseEntity)
    private readonly purchaseRepo: Repository<PurchaseEntity>,
    @InjectRepository(ProductStockEntity)
    private readonly stockRepo: Repository<ProductStockEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
    @InjectRepository(SupplierEntity)
    private readonly supplierRepo: Repository<SupplierEntity>,
  ) {}

  async getSalesSummary(businessId: string, dateFrom: string, dateTo: string) {
    const [row] = await this.saleRepo.query(
      `SELECT
         COUNT(*) as total_sales,
         COALESCE(SUM(grand_total), 0) as total_revenue,
         COALESCE(SUM(total_profit), 0) as total_profit,
         COALESCE(SUM(paid_amount), 0) as total_collected,
         COALESCE(SUM(due_amount), 0) as total_due
       FROM sales
       WHERE business_id = $1 AND sale_date >= $2 AND sale_date <= $3`,
      [businessId, dateFrom, dateTo],
    );
    return row;
  }

  async getPurchaseSummary(businessId: string, dateFrom: string, dateTo: string) {
    const [row] = await this.purchaseRepo.query(
      `SELECT
         COUNT(*) as total_purchases,
         COALESCE(SUM(grand_total), 0) as total_purchase_amount,
         COALESCE(SUM(paid_amount), 0) as total_paid,
         COALESCE(SUM(due_amount), 0) as total_due
       FROM purchases
       WHERE business_id = $1 AND purchase_date >= $2 AND purchase_date <= $3`,
      [businessId, dateFrom, dateTo],
    );
    return row;
  }

  async getSalesByDate(businessId: string, dateFrom: string, dateTo: string) {
    return this.saleRepo.query(
      `SELECT DATE(sale_date) as date,
         COUNT(*) as sales_count,
         COALESCE(SUM(grand_total), 0) as revenue,
         COALESCE(SUM(total_profit), 0) as profit
       FROM sales
       WHERE business_id = $1 AND sale_date >= $2 AND sale_date <= $3
       GROUP BY DATE(sale_date) ORDER BY date`,
      [businessId, dateFrom, dateTo],
    );
  }

  async getTopProducts(businessId: string, dateFrom: string, dateTo: string, limit = 10) {
    return this.saleRepo.query(
      `SELECT si.product_id, SUM(si.quantity) as total_qty, SUM(si.total) as total_revenue
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       WHERE s.business_id = $1 AND s.sale_date >= $2 AND s.sale_date <= $3
       GROUP BY si.product_id ORDER BY total_revenue DESC LIMIT $4`,
      [businessId, dateFrom, dateTo, limit],
    );
  }

  async getTopCustomers(businessId: string, dateFrom: string, dateTo: string, limit = 10) {
    return this.saleRepo.query(
      `SELECT s.customer_id, c.name as customer_name, COUNT(*) as total_orders, SUM(s.grand_total) as total_spent
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       WHERE s.business_id = $1 AND s.sale_date >= $2 AND s.sale_date <= $3
         AND s.customer_id IS NOT NULL
       GROUP BY s.customer_id, c.name ORDER BY total_spent DESC LIMIT $4`,
      [businessId, dateFrom, dateTo, limit],
    );
  }

  async getStockValuation(businessId: string) {
    const [row] = await this.stockRepo.query(
      `SELECT COALESCE(SUM(current_qty * avg_cost), 0) as total_stock_value,
              COUNT(DISTINCT product_id) as total_products
       FROM product_stocks WHERE business_id = $1`,
      [businessId],
    );
    return row;
  }

  async getProfitLoss(businessId: string, dateFrom: string, dateTo: string) {
    const sales = await this.getSalesSummary(businessId, dateFrom, dateTo);
    const purchases = await this.getPurchaseSummary(businessId, dateFrom, dateTo);

    return {
      revenue: Number(sales.total_revenue ?? 0),
      costOfGoods: Number(sales.total_revenue ?? 0) - Number(sales.total_profit ?? 0),
      grossProfit: Number(sales.total_profit ?? 0),
      totalPurchases: Number(purchases.total_purchase_amount ?? 0),
      netProfit: Number(sales.total_profit ?? 0),
    };
  }

  async getReceivables(businessId: string) {
    return this.customerRepo.find({
      where: { businessId },
      order: { currentBalance: 'DESC' },
    });
  }

  async getPayables(businessId: string) {
    return this.supplierRepo.find({
      where: { businessId },
      order: { currentBalance: 'DESC' },
    });
  }
}
