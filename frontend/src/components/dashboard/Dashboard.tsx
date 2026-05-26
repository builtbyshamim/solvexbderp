import { Link } from 'react-router-dom';
import {
  ShoppingCart, TrendingUp, TrendingDown, Package, Users,
  AlertTriangle, ArrowRight, Plus, Scan, FileText,
  CreditCard, Wallet, BarChart3, UserCheck,
} from 'lucide-react';

const statCards = [
  { label: "Today's Sales", value: '৳48,250', change: '+12.4%', up: true, icon: ShoppingCart, color: 'bg-[#fff3eb] text-[#ff6d29]', link: '/admin/sales/list' },
  { label: 'Receivable Due', value: '৳1,24,500', change: '18 customers', up: null, icon: CreditCard, color: 'bg-blue-50 text-blue-600', link: '/admin/sales/customer-ledger' },
  { label: 'Payable Due', value: '৳87,000', change: '7 suppliers', up: null, icon: Wallet, color: 'bg-purple-50 text-purple-600', link: '/admin/purchase/supplier-ledger' },
  { label: 'Low Stock Alerts', value: '12 Items', change: 'Needs reorder', up: false, icon: AlertTriangle, color: 'bg-red-50 text-red-500', link: '/admin/inventory/stock-report' },
];

const monthlyData = [
  { month: 'Jan', sales: 72, purchase: 48 },
  { month: 'Feb', sales: 85, purchase: 55 },
  { month: 'Mar', sales: 68, purchase: 42 },
  { month: 'Apr', sales: 90, purchase: 60 },
  { month: 'May', sales: 78, purchase: 50 },
  { month: 'Jun', sales: 95, purchase: 65 },
  { month: 'Jul', sales: 82, purchase: 58 },
  { month: 'Aug', sales: 88, purchase: 62 },
  { month: 'Sep', sales: 74, purchase: 45 },
  { month: 'Oct', sales: 92, purchase: 70 },
  { month: 'Nov', sales: 86, purchase: 55 },
  { month: 'Dec', sales: 98, purchase: 72 },
];

const recentSales = [
  { invoice: 'INV-005', customer: 'Abdullah Al Mamun', date: '2025-05-26', total: 11500, paid: 11500, due: 0, status: 'paid' },
  { invoice: 'INV-004', customer: 'Karim Enterprise', date: '2025-05-25', total: 5500, paid: 5500, due: 0, status: 'paid' },
  { invoice: 'INV-003', customer: 'Walk-in Customer', date: '2025-05-24', total: 21000, paid: 0, due: 21000, status: 'unpaid' },
  { invoice: 'INV-002', customer: 'Fatema Begum', date: '2025-05-23', total: 8500, paid: 5000, due: 3500, status: 'partial' },
  { invoice: 'INV-001', customer: 'Rahim Trading Co.', date: '2025-05-22', total: 15000, paid: 15000, due: 0, status: 'paid' },
];

const lowStockItems = [
  { name: 'Wireless Mouse', sku: 'SKU-003', current: 4, min: 10 },
  { name: 'Monitor', sku: 'SKU-005', current: 2, min: 5 },
  { name: 'Keyboard', sku: 'SKU-004', current: 6, min: 10 },
  { name: 'USB Hub', sku: 'SKU-008', current: 3, min: 8 },
];

const quickStats = [
  { label: 'Total Products', value: '124', icon: Package, color: 'text-blue-500 bg-blue-50' },
  { label: 'Active Customers', value: '48', icon: Users, color: 'text-green-600 bg-green-50' },
  { label: 'Employees', value: '24', icon: UserCheck, color: 'text-purple-600 bg-purple-50' },
  { label: 'This Month Revenue', value: '৳3.2L', icon: BarChart3, color: 'text-[#ff6d29] bg-[#fff3eb]' },
];

const statusStyle: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  unpaid: 'bg-red-100 text-red-500',
};

const Dashboard = () => (
  <div className="space-y-5">
    {/* Page title */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-[#26272F]">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monday, 26 May 2025 — Welcome back!</p>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/admin/pos" className="flex items-center gap-1.5 px-3.5 py-2 bg-[#26272F] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors">
          <Scan className="h-4 w-4" /> POS
        </Link>
        <Link to="/admin/sales/add" className="flex items-center gap-1.5 px-3.5 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
          <Plus className="h-4 w-4" /> New Sale
        </Link>
      </div>
    </div>

    {/* Stat Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <Link key={card.label} to={card.link} className="bg-white border border-[#DBDFE9] rounded-xl p-4 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              {card.up !== null && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${card.up ? 'text-green-600' : 'text-red-500'}`}>
                  {card.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {card.change}
                </span>
              )}
            </div>
            <p className="text-xl font-bold text-[#26272F]">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              {card.label}
              {card.up === null && <span className="text-gray-400">— {card.change}</span>}
            </p>
          </Link>
        );
      })}
    </div>

    {/* Quick Stats Row */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {quickStats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="bg-white border border-[#DBDFE9] rounded-xl p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg flex-shrink-0 ${s.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-[#26272F] leading-tight">{s.value}</p>
              <p className="text-xs text-gray-500 truncate">{s.label}</p>
            </div>
          </div>
        );
      })}
    </div>

    {/* Chart + Low Stock */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Monthly Sales vs Purchase Chart */}
      <div className="lg:col-span-2 bg-white border border-[#DBDFE9] rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-[#26272F]">Sales vs Purchase</h3>
            <p className="text-xs text-gray-400 mt-0.5">Monthly overview for 2025</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#ff6d29] inline-block" /> Sales</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#DBDFE9] inline-block" /> Purchase</span>
          </div>
        </div>
        <div className="flex items-end gap-1.5 h-44">
          {monthlyData.map((d) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-0.5 group">
              <div className="relative w-full flex items-end gap-0.5 h-36">
                <div
                  className="flex-1 bg-[#DBDFE9] rounded-t transition-all duration-300 group-hover:bg-gray-300"
                  style={{ height: `${d.purchase}%` }}
                  title={`Purchase: ${d.purchase}%`}
                />
                <div
                  className="flex-1 bg-[#ff6d29] rounded-t transition-all duration-300 group-hover:bg-[#e65a1f]"
                  style={{ height: `${d.sales}%` }}
                  title={`Sales: ${d.sales}%`}
                />
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
            <h3 className="text-sm font-semibold text-[#26272F]">Low Stock Alert</h3>
            <p className="text-xs text-gray-400 mt-0.5">Items needing reorder</p>
          </div>
          <Link to="/admin/inventory/stock-report" className="text-xs text-[#ff6d29] hover:underline flex items-center gap-0.5">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {lowStockItems.map((item) => {
            const pct = Math.round((item.current / item.min) * 100);
            return (
              <div key={item.sku}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-medium text-[#26272F] leading-tight">{item.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                  </div>
                  <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{item.current} left</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-400 rounded-full transition-all"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <Link to="/admin/purchase/add" className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-[#ff6d29] text-[#ff6d29] rounded-lg text-xs font-medium hover:bg-[#fff3eb] transition-colors">
          <Plus className="h-3.5 w-3.5" /> Create Purchase Order
        </Link>
      </div>
    </div>

    {/* Recent Sales */}
    <div className="bg-white border border-[#DBDFE9] rounded-xl">
      <div className="px-5 py-4 border-b border-[#DBDFE9] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#26272F]">Recent Sales</h3>
          <p className="text-xs text-gray-400 mt-0.5">Latest 5 transactions</p>
        </div>
        <Link to="/admin/sales/list" className="text-xs text-[#ff6d29] hover:underline flex items-center gap-0.5">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-[#DBDFE9]">
              {['Invoice', 'Customer', 'Date', 'Total', 'Paid', 'Due', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recentSales.map((sale) => (
              <tr key={sale.invoice} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-[#ff6d29] font-semibold">{sale.invoice}</td>
                <td className="px-4 py-3 font-medium text-[#26272F]">{sale.customer}</td>
                <td className="px-4 py-3 text-gray-500">{sale.date}</td>
                <td className="px-4 py-3 font-semibold">৳{sale.total.toLocaleString()}</td>
                <td className="px-4 py-3 text-green-600">৳{sale.paid.toLocaleString()}</td>
                <td className="px-4 py-3 text-red-500">{sale.due > 0 ? `৳${sale.due.toLocaleString()}` : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusStyle[sale.status]}`}>
                    {sale.status}
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
        { label: 'New Purchase', icon: FileText, to: '/admin/purchase/add', cls: 'border-blue-200 text-blue-600 hover:bg-blue-50' },
        { label: 'Add Product', icon: Package, to: '/admin/inventory/products/add', cls: 'border-[#DBDFE9] text-gray-600 hover:bg-gray-50' },
        { label: 'Stock Adjust', icon: BarChart3, to: '/admin/inventory/stock-adjustment', cls: 'border-[#DBDFE9] text-gray-600 hover:bg-gray-50' },
        { label: 'Sales Report', icon: TrendingUp, to: '/admin/reports/sales', cls: 'border-green-200 text-green-600 hover:bg-green-50' },
      ].map((a) => {
        const Icon = a.icon;
        return (
          <Link key={a.label} to={a.to} className={`flex items-center gap-2.5 px-4 py-3 bg-white border rounded-xl text-sm font-medium transition-colors ${a.cls}`}>
            <Icon className="h-4 w-4 flex-shrink-0" /> {a.label}
          </Link>
        );
      })}
    </div>
  </div>
);

export default Dashboard;
