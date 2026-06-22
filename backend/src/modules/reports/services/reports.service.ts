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

  async getCategorySales(businessId: string, dateFrom?: string, dateTo?: string) {
    const from = dateFrom || monthStartStr();
    const to = dateTo || todayStr();
    const rows = await this.saleRepo.query(
      `SELECT
         COALESCE(c.id::text, 'uncategorized') AS category_id,
         COALESCE(c.name, 'Uncategorized') AS category_name,
         COUNT(DISTINCT si.product_id) AS product_count,
         SUM(si.quantity) AS total_qty,
         SUM(si.total) AS total_revenue,
         SUM(si.profit) AS total_profit
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       LEFT JOIN products p ON p.id = si.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE s.business_id = $1 AND s.sale_date >= $2 AND s.sale_date <= $3
         AND s.status != 'cancelled'
       GROUP BY c.id, c.name
       ORDER BY total_revenue DESC`,
      [businessId, from, to],
    );
    return rows.map((r: any) => ({
      categoryId: r.category_id,
      categoryName: r.category_name,
      productCount: Number(r.product_count),
      totalQty: Number(r.total_qty),
      totalRevenue: Number(r.total_revenue),
      totalProfit: Number(r.total_profit ?? 0),
    }));
  }

  async getPaymentMethodBreakdown(businessId: string, dateFrom?: string, dateTo?: string) {
    const from = dateFrom || monthStartStr();
    const to = dateTo || todayStr();
    const rows = await this.saleRepo.query(
      `SELECT
         COALESCE(payment_method, 'unknown') AS method,
         COUNT(*) AS count,
         SUM(grand_total) AS total,
         SUM(paid_amount) AS collected
       FROM sales
       WHERE business_id = $1 AND sale_date >= $2 AND sale_date <= $3
         AND status != 'cancelled'
       GROUP BY payment_method
       ORDER BY total DESC`,
      [businessId, from, to],
    );
    return rows.map((r: any) => ({
      method: r.method,
      count: Number(r.count),
      total: Number(r.total),
      collected: Number(r.collected),
    }));
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

  async getStockPositionReport(businessId: string, search?: string, categoryId?: string) {
    let whereProduct = `p.business_id = $1 AND p.is_active = true`;
    const params: any[] = [businessId];

    if (search) {
      params.push(`%${search}%`);
      whereProduct += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`;
    }
    if (categoryId) {
      params.push(categoryId);
      whereProduct += ` AND p.category_id = $${params.length}`;
    }

    const rows = await this.stockRepo.query(
      `SELECT
         p.id              AS product_id,
         p.name            AS product_name,
         p.sku,
         p.purchase_price,
         p.selling_price,
         p.alert_quantity,
         c.name            AS category_name,
         u.name            AS unit_name,
         ps.location_id,
         COALESCE(ps.current_qty, 0) AS current_qty,
         COALESCE(ps.avg_cost, 0)    AS avg_cost,
         sl.name           AS location_name,
         sl.is_default,
         sl.warehouse_id,
         w.name            AS warehouse_name
       FROM products p
       LEFT JOIN categories c       ON c.id = p.category_id
       LEFT JOIN units u             ON u.id = p.unit_id
       LEFT JOIN product_stocks ps   ON ps.product_id = p.id AND ps.business_id = $1
       LEFT JOIN stock_locations sl  ON sl.id = ps.location_id
       LEFT JOIN warehouses w        ON w.id = sl.warehouse_id
       WHERE ${whereProduct}
       ORDER BY p.name ASC`,
      params,
    );

    // Collect unique locations
    const locationMap = new Map<string, { id: string; name: string; isDefault: boolean; warehouseId: string | null; warehouseName: string | null }>();
    for (const r of rows) {
      if (r.location_id && !locationMap.has(r.location_id)) {
        locationMap.set(r.location_id, {
          id: r.location_id,
          name: r.location_name ?? (r.is_default ? 'Business Default' : r.warehouse_name ?? r.location_id),
          isDefault: r.is_default === true || r.is_default === 't',
          warehouseId: r.warehouse_id ?? null,
          warehouseName: r.warehouse_name ?? null,
        });
      }
    }
    const locations = Array.from(locationMap.values()).sort((a, b) => (a.isDefault ? -1 : b.isDefault ? 1 : 0));

    // Group rows by product
    const productMap = new Map<string, any>();
    for (const r of rows) {
      if (!productMap.has(r.product_id)) {
        productMap.set(r.product_id, {
          id: r.product_id,
          name: r.product_name,
          sku: r.sku,
          categoryName: r.category_name ?? '—',
          unitName: r.unit_name ?? '—',
          purchasePrice: Number(r.purchase_price ?? 0),
          sellingPrice: Number(r.selling_price ?? 0),
          alertQuantity: r.alert_quantity != null ? Number(r.alert_quantity) : null,
          stocks: {} as Record<string, { qty: number; avgCost: number }>,
        });
      }
      if (r.location_id) {
        const prod = productMap.get(r.product_id);
        prod.stocks[r.location_id] = {
          qty: Number(r.current_qty),
          avgCost: Number(r.avg_cost),
        };
      }
    }

    const products = Array.from(productMap.values()).map((p) => {
      let totalQty = 0;
      let totalValue = 0;
      for (const loc of locations) {
        const s = p.stocks[loc.id];
        if (s) {
          totalQty += s.qty;
          totalValue += s.qty * s.avgCost;
        }
      }
      return { ...p, totalQty, totalValue: Number(totalValue.toFixed(2)) };
    });

    const totalQty = products.reduce((s, p) => s + p.totalQty, 0);
    const totalValue = products.reduce((s, p) => s + p.totalValue, 0);
    const lowStockCount = products.filter(
      (p) => p.alertQuantity != null && p.totalQty > 0 && p.totalQty <= p.alertQuantity,
    ).length;
    const outOfStockCount = products.filter((p) => p.totalQty <= 0).length;

    return {
      locations,
      products,
      summary: {
        totalProducts: products.length,
        totalQty: Number(totalQty.toFixed(4)),
        totalValue: Number(totalValue.toFixed(2)),
        lowStockCount,
        outOfStockCount,
      },
    };
  }
}
