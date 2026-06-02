import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SaleEntity } from 'src/modules/sales/entities/sale.entity';
import { PurchaseEntity } from 'src/modules/purchase/entities/purchase.entity';
import { ProductStockEntity } from 'src/modules/inventory/product/entities/product-stock.entity';
import { CustomerEntity } from 'src/modules/sales/entities/customer.entity';
import { SupplierEntity } from 'src/modules/purchase/entities/supplier.entity';

const todayStr = () => new Date().toISOString().split('T')[0];
const monthStartStr = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
};

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
    private readonly dataSource: DataSource,
  ) {}

  async getSalesSummary(businessId: string, dateFrom?: string, dateTo?: string) {
    const from = dateFrom || monthStartStr();
    const to = dateTo || todayStr();
    const [row] = await this.saleRepo.query(
      `SELECT
         COUNT(*) as total_sales,
         COALESCE(SUM(grand_total), 0) as total_revenue,
         COALESCE(SUM(total_profit), 0) as total_profit,
         COALESCE(SUM(paid_amount), 0) as total_collected,
         COALESCE(SUM(due_amount), 0) as total_due
       FROM sales
       WHERE business_id = $1 AND sale_date >= $2 AND sale_date <= $3
         AND status != 'cancelled'`,
      [businessId, from, to],
    );
    return {
      totalSales: Number(row?.total_sales ?? 0),
      totalRevenue: Number(row?.total_revenue ?? 0),
      totalProfit: Number(row?.total_profit ?? 0),
      totalCollected: Number(row?.total_collected ?? 0),
      totalDue: Number(row?.total_due ?? 0),
    };
  }

  async getPurchaseSummary(businessId: string, dateFrom?: string, dateTo?: string) {
    const from = dateFrom || monthStartStr();
    const to = dateTo || todayStr();
    const [row] = await this.purchaseRepo.query(
      `SELECT
         COUNT(*) as total_purchases,
         COALESCE(SUM(grand_total), 0) as total_amount,
         COALESCE(SUM(paid_amount), 0) as total_paid,
         COALESCE(SUM(due_amount), 0) as total_due
       FROM purchases
       WHERE business_id = $1 AND purchase_date >= $2 AND purchase_date <= $3`,
      [businessId, from, to],
    );
    return {
      totalPurchases: Number(row?.total_purchases ?? 0),
      totalAmount: Number(row?.total_amount ?? 0),
      totalPaid: Number(row?.total_paid ?? 0),
      totalDue: Number(row?.total_due ?? 0),
    };
  }

  async getSalesByDate(businessId: string, dateFrom?: string, dateTo?: string) {
    const from = dateFrom || monthStartStr();
    const to = dateTo || todayStr();
    const rows = await this.saleRepo.query(
      `SELECT DATE(sale_date) as date,
         COUNT(*) as sales_count,
         COALESCE(SUM(grand_total), 0) as revenue,
         COALESCE(SUM(total_profit), 0) as profit,
         COALESCE(SUM(paid_amount), 0) as collected,
         COALESCE(SUM(due_amount), 0) as due
       FROM sales
       WHERE business_id = $1 AND sale_date >= $2 AND sale_date <= $3
         AND status != 'cancelled'
       GROUP BY DATE(sale_date) ORDER BY date`,
      [businessId, from, to],
    );
    return rows.map((r: any) => ({
      date: r.date,
      salesCount: Number(r.sales_count),
      revenue: Number(r.revenue),
      profit: Number(r.profit),
      collected: Number(r.collected),
      due: Number(r.due),
    }));
  }

  async getTopProducts(businessId: string, dateFrom?: string, dateTo?: string, limit = 10) {
    const from = dateFrom || monthStartStr();
    const to = dateTo || todayStr();
    const rows = await this.saleRepo.query(
      `SELECT si.product_id,
              p.name as product_name,
              COALESCE(p.sku, '') as sku,
              SUM(si.quantity) as total_qty,
              SUM(si.total) as total_revenue,
              SUM(si.profit) as total_profit
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       LEFT JOIN products p ON p.id = si.product_id
       WHERE s.business_id = $1 AND s.sale_date >= $2 AND s.sale_date <= $3
         AND s.status != 'cancelled'
       GROUP BY si.product_id, p.name, p.sku
       ORDER BY total_revenue DESC LIMIT $4`,
      [businessId, from, to, limit],
    );
    return rows.map((r: any) => ({
      productId: r.product_id,
      productName: r.product_name ?? r.product_id,
      sku: r.sku,
      totalQty: Number(r.total_qty),
      totalRevenue: Number(r.total_revenue),
      totalProfit: Number(r.total_profit ?? 0),
    }));
  }

  async getTopCustomers(businessId: string, dateFrom?: string, dateTo?: string, limit = 20) {
    const from = dateFrom || monthStartStr();
    const to = dateTo || todayStr();
    const rows = await this.saleRepo.query(
      `SELECT s.customer_id,
              c.name as customer_name,
              c.phone as phone,
              COUNT(*) as total_orders,
              SUM(s.grand_total) as total_spent,
              SUM(s.paid_amount) as total_paid,
              SUM(s.due_amount) as total_due,
              MAX(s.sale_date) as last_purchase
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       WHERE s.business_id = $1 AND s.sale_date >= $2 AND s.sale_date <= $3
         AND s.customer_id IS NOT NULL AND s.status != 'cancelled'
       GROUP BY s.customer_id, c.name, c.phone
       ORDER BY total_spent DESC LIMIT $4`,
      [businessId, from, to, limit],
    );
    return rows.map((r: any) => ({
      customerId: r.customer_id,
      name: r.customer_name ?? '—',
      phone: r.phone,
      totalOrders: Number(r.total_orders),
      totalSpent: Number(r.total_spent),
      totalPaid: Number(r.total_paid),
      totalDue: Number(r.total_due ?? 0),
      lastPurchase: r.last_purchase,
    }));
  }

  async getTopSuppliers(businessId: string, dateFrom?: string, dateTo?: string, limit = 20) {
    const from = dateFrom || monthStartStr();
    const to = dateTo || todayStr();
    const rows = await this.purchaseRepo.query(
      `SELECT p.supplier_id,
              s.name as supplier_name,
              s.phone as phone,
              COUNT(*) as total_orders,
              SUM(p.grand_total) as total_amount,
              SUM(p.paid_amount) as total_paid,
              SUM(p.due_amount) as total_due,
              MAX(p.purchase_date) as last_purchase
       FROM purchases p
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       WHERE p.business_id = $1 AND p.purchase_date >= $2 AND p.purchase_date <= $3
         AND p.supplier_id IS NOT NULL
       GROUP BY p.supplier_id, s.name, s.phone
       ORDER BY total_amount DESC LIMIT $4`,
      [businessId, from, to, limit],
    );
    return rows.map((r: any) => ({
      supplierId: r.supplier_id,
      name: r.supplier_name ?? '—',
      phone: r.phone,
      totalOrders: Number(r.total_orders),
      totalAmount: Number(r.total_amount),
      totalPaid: Number(r.total_paid),
      totalDue: Number(r.total_due ?? 0),
      lastPurchase: r.last_purchase,
    }));
  }

  async getStockValuation(businessId: string) {
    const [row] = await this.stockRepo.query(
      `SELECT COALESCE(SUM(current_qty * avg_cost), 0) as total_value,
              COUNT(DISTINCT product_id) as total_products,
              COUNT(*) as total_locations
       FROM product_stocks WHERE business_id = $1`,
      [businessId],
    );
    return {
      totalValue: Number(row?.total_value ?? 0),
      totalProducts: Number(row?.total_products ?? 0),
      totalLocations: Number(row?.total_locations ?? 0),
    };
  }

  async getProfitLoss(businessId: string, dateFrom?: string, dateTo?: string) {
    const sales = await this.getSalesSummary(businessId, dateFrom, dateTo);
    const purchases = await this.getPurchaseSummary(businessId, dateFrom, dateTo);

    const revenue = sales.totalRevenue;
    const costOfGoods = revenue - sales.totalProfit;
    const grossProfit = sales.totalProfit;

    return {
      revenue,
      costOfGoods,
      grossProfit,
      totalPurchases: purchases.totalAmount,
      netProfit: grossProfit,
      profitMargin: revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(2)) : 0,
    };
  }

  async getReceivables(businessId: string) {
    const customers = await this.customerRepo.find({
      where: { businessId },
      order: { currentBalance: 'DESC' },
    });
    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      openingBalance: Number(c.openingBalance),
      currentBalance: Number(c.currentBalance),
    }));
  }

  async getPayables(businessId: string) {
    const suppliers = await this.supplierRepo.find({
      where: { businessId },
      order: { currentBalance: 'DESC' },
    });
    return suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      company: s.company,
      openingBalance: Number(s.openingBalance),
      currentBalance: Number(s.currentBalance),
    }));
  }
}
