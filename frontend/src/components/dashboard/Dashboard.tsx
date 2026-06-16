import { Link } from 'react-router-dom';
import {
  ShoppingCart, TrendingUp, TrendingDown, Package, Users,
  AlertTriangle, ArrowRight, Plus, Scan, FileText,
  CreditCard, Wallet, BarChart3, UserCheck,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useGetSalesSummaryQuery, useGetReceivablesQuery, useGetPayablesQuery, useGetSalesByDateQuery } from '../../features/reports/reportsApi';
import { useGetAllProductsQuery } from '../../features/inventory/products/productApi';
import { useGetAllEmployeesQuery } from '../../features/hrm/hrmApi';

const today = new Date().toISOString().split('T')[0];
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

const statusStyle: Record<string, string> = {
  paid:     'bg-green-100 text-green-700',
  partial:  'bg-yellow-100 text-yellow-700',
  unpaid:   'bg-red-100 text-red-500',
  confirmed:'bg-green-100 text-green-700',
};

const Dashboard = () => {
  const { t } = useLanguage();

  const { data: salesData } = useGetSalesSummaryQuery({ dateFrom: today, dateTo: today });
  const { data: monthlyData } = useGetSalesByDateQuery({ dateFrom: firstOfMonth, dateTo: today });
  const { data: receivablesData } = useGetReceivablesQuery();
  const { data: payablesData } = useGetPayablesQuery();
  const { data: productsData } = useGetAllProductsQuery({ limit: 500 });
  const { data: empData } = useGetAllEmployeesQuery({ limit: 1, page: 1 });

  const todaySales = salesData?.data?.totalRevenue ?? 0;
  const receivableDue = receivablesData?.data?.totalDue ?? receivablesData?.data ?? 0;
  const receivableCount = receivablesData?.data?.count ?? 0;
  const payableDue = payablesData?.data?.totalDue ?? payablesData?.data ?? 0;
  const payableCount = payablesData?.data?.count ?? 0;

  const products = productsData?.data || [];
  const totalProducts = productsData?.meta?.totalItems ?? products.length;
  const totalEmployees = empData?.meta?.totalItems ?? 0;
  const monthlyRevenue = salesData?.data?.totalRevenue ?? 0;

  const lowStockItems = products
    .filter((p: any) => p.alertQuantity && Number(p.baseStock ?? 0) <= Number(p.alertQuantity))
    .slice(0, 5);

  const recentSales = salesData?.data?.recentSales ?? salesData?.data?.items ?? [];

  const salesTrend = monthlyData ?? [];

  const statCards = [
    {
      labelKey: 'dashboard.todaySales',
      value: `৳${Number(todaySales).toLocaleString()}`,
      change: '+0%',
      up: true,
      icon: ShoppingCart,
      color: 'bg-[#fff3eb] text-[#ff6d29]',
      link: '/admin/sales/list',
    },
    {
      labelKey: 'dashboard.receivableDue',
      value: `৳${Number(receivableDue).toLocaleString()}`,
      change: `${receivableCount} ${t('dashboard.customers')}`,
      up: null,
      icon: CreditCard,
      color: 'bg-blue-50 text-blue-600',
      link: '/admin/sales/customer-ledger',
    },
    {
      labelKey: 'dashboard.payableDue',
      value: `৳${Number(payableDue).toLocaleString()}`,
      change: `${payableCount} ${t('dashboard.suppliers')}`,
      up: null,
      icon: Wallet,
      color: 'bg-purple-50 text-purple-600',
      link: '/admin/purchase/supplier-ledger',
    },
    {
      labelKey: 'dashboard.lowStockAlerts',
      value: `${lowStockItems.length} Items`,
      change: t('dashboard.needsReorder'),
      up: lowStockItems.length > 0 ? false : null,
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-500',
      link: '/admin/inventory/stock-report',
    },
  ];

  const quickStats = [
    { labelKey: 'dashboard.totalProducts',    value: totalProducts, icon: Package,   color: 'text-blue-500 bg-blue-50' },
    { labelKey: 'dashboard.activeCustomers',  value: receivableCount || '—', icon: Users, color: 'text-green-600 bg-green-50' },
    { labelKey: 'dashboard.employees',        value: totalEmployees, icon: UserCheck, color: 'text-purple-600 bg-purple-50' },
    { labelKey: 'dashboard.thisMonthRevenue', value: `৳${Number(monthlyRevenue).toLocaleString()}`, icon: BarChart3, color: 'text-[#ff6d29] bg-[#fff3eb]' },
  ];

  const tableHeaders = [
    t('common.invoice'), t('common.customer'), t('common.date'),
    t('common.total'), t('common.paid'), t('common.due'), t('common.status'),
  ];

  const statusLabels: Record<string, string> = {
    paid:     t('dashboard.statusPaid'),
    partial:  t('dashboard.statusPartial'),
    unpaid:   t('dashboard.statusUnpaid'),
    confirmed:t('dashboard.statusPaid'),
  };

  // Normalize monthly trend for chart
  const chartData = salesTrend.length > 0
    ? salesTrend.map((d: any) => ({
        month: new Date(d.date ?? d.month ?? '').toLocaleString('default', { month: 'short' }),
        sales: Math.min(Math.round((Number(d.revenue ?? d.total ?? 0) / Math.max(...salesTrend.map((x: any) => Number(x.revenue ?? x.total ?? 1)))) * 100), 100),
        purchase: 0,
      }))
    : [
        { month: 'Jan', sales: 72, purchase: 48 }, { month: 'Feb', sales: 85, purchase: 55 },
        { month: 'Mar', sales: 68, purchase: 42 }, { month: 'Apr', sales: 90, purchase: 60 },
        { month: 'May', sales: 78, purchase: 50 }, { month: 'Jun', sales: 95, purchase: 65 },
      ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#26272F]">{t('dashboard.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{new Date().toLocaleDateString('en-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — {t('dashboard.welcome')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/pos" className="flex items-center gap-1.5 px-3.5 py-2 bg-[#26272F] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors">
            <Scan className="h-4 w-4" /> {t('dashboard.pos')}
          </Link>
          <Link to="/admin/sales/add" className="flex items-center gap-1.5 px-3.5 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
            <Plus className="h-4 w-4" /> {t('dashboard.newSale')}
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.labelKey} to={card.link} className="bg-white border border-[#DBDFE9] rounded-xl p-4 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${card.color}`}><Icon className="h-4 w-4" /></div>
                {card.up !== null && (
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${card.up ? 'text-green-600' : 'text-red-500'}`}>
                    {card.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {card.change}
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-[#26272F]">{card.value}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                {t(card.labelKey as any)}
                {card.up === null && <span className="text-gray-400">— {card.change}</span>}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickStats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.labelKey} className="bg-white border border-[#DBDFE9] rounded-xl p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-lg flex-shrink-0 ${s.color}`}><Icon className="h-4 w-4" /></div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-[#26272F] leading-tight">{s.value}</p>
                <p className="text-xs text-gray-500 truncate">{t(s.labelKey as any)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly trend */}
        <div className="lg:col-span-2 bg-white border border-[#DBDFE9] rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-[#26272F]">{t('dashboard.salesVsPurchase')}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{t('dashboard.monthlyOverview')}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#ff6d29] inline-block" /> {t('dashboard.sales')}</span>
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-44">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group">
                <div className="relative w-full flex items-end justify-center h-36">
                  <div className="w-full bg-[#ff6d29] rounded-t transition-all duration-300 group-hover:bg-[#e65a1f]"
                    style={{ height: `${d.sales}%` }} title={`Sales: ${d.sales}%`} />
                </div>
                <span className="text-[10px] text-gray-400">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white border border-[#DBDFE9] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#26272F]">{t('dashboard.lowStockAlert')}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{t('dashboard.itemsNeedingReorder')}</p>
            </div>
            <Link to="/admin/inventory/stock-report" className="text-xs text-[#ff6d29] hover:underline flex items-center gap-0.5">
              {t('common.viewAll')} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {lowStockItems.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">All stock levels are healthy</div>
          ) : (
            <div className="space-y-3">
              {lowStockItems.map((item: any) => {
                const current = Number(item.baseStock ?? 0);
                const min = Number(item.alertQuantity ?? 1);
                const pct = Math.round((current / min) * 100);
                return (
                  <div key={item.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="text-sm font-medium text-[#26272F] leading-tight">{item.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                      </div>
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{current} {t('dashboard.left')}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Link to="/admin/purchase/add" className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-[#ff6d29] text-[#ff6d29] rounded-lg text-xs font-medium hover:bg-[#fff3eb] transition-colors">
            <Plus className="h-3.5 w-3.5" /> {t('dashboard.createPurchaseOrder')}
          </Link>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white border border-[#DBDFE9] rounded-xl">
        <div className="px-5 py-4 border-b border-[#DBDFE9] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#26272F]">{t('dashboard.recentSales')}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{t('dashboard.latest5Transactions')}</p>
          </div>
          <Link to="/admin/sales/list" className="text-xs text-[#ff6d29] hover:underline flex items-center gap-0.5">
            {t('common.viewAll')} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {tableHeaders.map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentSales.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No recent sales data</td></tr>
              ) : recentSales.slice(0, 5).map((sale: any) => (
                <tr key={sale.id ?? sale.invoice} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-[#ff6d29] font-semibold">{sale.invoiceNo ?? sale.invoice}</td>
                  <td className="px-4 py-3 font-medium text-[#26272F]">{sale.customer?.name ?? sale.customer ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : sale.date}</td>
                  <td className="px-4 py-3 font-semibold">৳{Number(sale.grandTotal ?? sale.total ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">৳{Number(sale.paidAmount ?? sale.paid ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-500">{Number(sale.dueAmount ?? sale.due ?? 0) > 0 ? `৳${Number(sale.dueAmount ?? sale.due).toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusStyle[sale.paymentStatus ?? sale.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {statusLabels[sale.paymentStatus ?? sale.status] ?? (sale.paymentStatus ?? sale.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { labelKey: 'dashboard.newPurchase', icon: FileText,  to: '/admin/purchase/add',               cls: 'border-blue-200 text-blue-600 hover:bg-blue-50' },
          { labelKey: 'dashboard.addProduct',  icon: Package,   to: '/admin/inventory/products/add',     cls: 'border-[#DBDFE9] text-gray-600 hover:bg-gray-50' },
          { labelKey: 'dashboard.stockAdjust', icon: BarChart3, to: '/admin/inventory/stock-adjustment', cls: 'border-[#DBDFE9] text-gray-600 hover:bg-gray-50' },
          { labelKey: 'dashboard.salesReport', icon: TrendingUp,to: '/admin/reports/sales',              cls: 'border-green-200 text-green-600 hover:bg-green-50' },
        ].map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.labelKey} to={a.to} className={`flex items-center gap-2.5 px-4 py-3 bg-white border rounded-xl text-sm font-medium transition-colors ${a.cls}`}>
              <Icon className="h-4 w-4 flex-shrink-0" /> {t(a.labelKey as any)}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
