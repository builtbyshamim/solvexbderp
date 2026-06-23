import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Package, ShoppingCart, TrendingUp, TrendingDown,
  Loader2, Edit2, X, Check, BarChart3, List, BookOpen, Tag,
  AlertCircle, BoxIcon, DollarSign, Layers,
} from 'lucide-react';
import moment from 'moment';
import toast from 'react-hot-toast';
import PageHeader from '../../../../components/shared/PageHeader';
import { useGetProductDetailsQuery, useUpdateOpeningStockMutation } from '../productApi';

const fmt = (n: any) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtQty = (n: any) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
const fmtDate = (d: any) => (d ? moment(d).format('DD MMM YYYY') : '—');

const paymentColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  unpaid: 'bg-red-100 text-red-600',
};

const txTypeColors: Record<string, string> = {
  OPENING: 'bg-purple-100 text-purple-700',
  PURCHASE: 'bg-blue-100 text-blue-700',
  PURCHASE_RETURN: 'bg-orange-100 text-orange-700',
  SALE: 'bg-green-100 text-green-700',
  SALE_RETURN: 'bg-red-100 text-red-700',
  ADJUSTMENT_IN: 'bg-teal-100 text-teal-700',
  ADJUSTMENT_OUT: 'bg-pink-100 text-pink-700',
  TRANSFER_IN: 'bg-cyan-100 text-cyan-700',
  TRANSFER_OUT: 'bg-amber-100 text-amber-700',
  DAMAGED: 'bg-red-100 text-red-800',
  LOST: 'bg-gray-100 text-gray-700',
};

const Badge = ({ status }: { status: string }) => (
  <span
    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      paymentColors[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-500'
    }`}
  >
    {status?.toUpperCase() ?? '—'}
  </span>
);

const TxBadge = ({ type }: { type: string }) => (
  <span className={`px-2 py-0.5 rounded text-xs font-medium ${txTypeColors[type] ?? 'bg-gray-100 text-gray-600'}`}>
    {type?.replace(/_/g, ' ')}
  </span>
);

// ── Opening Stock Edit Modal ─────────────────────────────────────────────────

interface OpeningStockModalProps {
  productId: string;
  current: number;
  onClose: () => void;
}

const OpeningStockModal = ({ productId, current, onClose }: OpeningStockModalProps) => {
  const [value, setValue] = useState(String(current));
  const [updateOpeningStock, { isLoading }] = useUpdateOpeningStockMutation();

  const handleSave = async () => {
    const qty = parseFloat(value);
    if (isNaN(qty) || qty < 0) {
      toast.error('Please enter a valid quantity (≥ 0)');
      return;
    }
    try {
      await updateOpeningStock({ id: productId, openingQty: qty }).unwrap();
      toast.success('Opening stock updated successfully');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update opening stock');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-[#26272F]">Edit Opening Stock</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Opening Quantity</label>
            <input
              type="number"
              min="0"
              step="0.0001"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1.5">
              This will adjust the stock balance and ledger entry.
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  action?: React.ReactNode;
}

const StatCard = ({ icon, iconBg, label, value, sub, subColor, action }: StatCardProps) => (
  <div className="bg-white border border-[#DBDFE9] rounded-xl p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>{icon}</div>
      {action}
    </div>
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-2xl font-bold text-[#26272F]">{value}</p>
    {sub && <p className={`text-xs mt-1 ${subColor ?? 'text-gray-400'}`}>{sub}</p>}
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────

type Tab = 'overview' | 'sales' | 'purchases' | 'ledger';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [editingOpeningStock, setEditingOpeningStock] = useState(false);

  const { data, isLoading, isError } = useGetProductDetailsQuery(id!, { skip: !id });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff6d29]" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-20 text-gray-400">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-lg font-medium">Product not found</p>
        <Link to="/admin/inventory/products" className="text-[#ff6d29] text-sm mt-2 inline-block">
          ← Back to products
        </Link>
      </div>
    );
  }

  const { product, stockSummary, salesSummary, purchaseSummary, salesHistory, purchaseHistory, ledger } = data;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'sales', label: `Sales (${salesHistory?.length ?? 0})`, icon: <ShoppingCart className="h-4 w-4" /> },
    { key: 'purchases', label: `Purchases (${purchaseHistory?.length ?? 0})`, icon: <TrendingDown className="h-4 w-4" /> },
    { key: 'ledger', label: `Stock Ledger (${ledger?.length ?? 0})`, icon: <BookOpen className="h-4 w-4" /> },
  ];

  return (
    <div>
      {editingOpeningStock && (
        <OpeningStockModal
          productId={id!}
          current={stockSummary?.openingStock ?? 0}
          onClose={() => setEditingOpeningStock(false)}
        />
      )}

      <PageHeader
        title={product.name}
        subtitle="Product Details & Transaction History"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Products', path: '/admin/inventory/products' },
          { label: product.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to={`/admin/inventory/products/edit/${id}`}
              className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]"
            >
              <Edit2 className="h-4 w-4" /> Edit Product
            </Link>
            <Link
              to="/admin/inventory/products"
              className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </div>
        }
      />

      {/* ── Product Info + Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-6">
        {/* Product Info Card */}
        <div className="lg:col-span-1 bg-white border border-[#DBDFE9] rounded-xl p-5">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-36 object-cover rounded-lg mb-4 border border-gray-100"
            />
          ) : (
            <div className="w-full h-36 bg-gray-50 rounded-lg mb-4 flex items-center justify-center border border-gray-100">
              <Package className="h-12 w-12 text-gray-200" />
            </div>
          )}

          <p className="font-bold text-[#26272F] text-lg leading-snug">{product.name}</p>

          <div className="mt-3 space-y-2 text-sm">
            {product.sku && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">SKU</span>
                <span className="font-mono font-medium text-[#26272F]">{product.sku}</span>
              </div>
            )}
            {product.barcode && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Barcode</span>
                <span className="font-mono text-[#26272F]">{product.barcode}</span>
              </div>
            )}
            {product.category && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Category</span>
                <span className="text-[#26272F]">{product.category.name}</span>
              </div>
            )}
            {product.brand && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Brand</span>
                <span className="text-[#26272F]">{product.brand.name}</span>
              </div>
            )}
            {product.unit && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Unit</span>
                <span className="text-[#26272F]">{product.unit.name}</span>
              </div>
            )}
            {product.warranty && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Warranty</span>
                <span className="text-[#26272F]">{product.warranty.name}</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Purchase Price</span>
              <span className="font-semibold text-blue-600">৳{fmt(product.purchasePrice)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Selling Price</span>
              <span className="font-semibold text-green-600">৳{fmt(product.sellingPrice)}</span>
            </div>
            {product.wholesalePrice && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Wholesale</span>
                <span className="font-semibold text-orange-500">৳{fmt(product.wholesalePrice)}</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                product.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}
            >
              {product.isActive !== false ? 'Active' : 'Inactive'}
            </span>
            <span className="ml-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 capitalize">
              {product.productType}
            </span>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard
            icon={<BoxIcon className="h-5 w-5 text-indigo-600" />}
            iconBg="bg-indigo-50"
            label="Current Stock"
            value={fmtQty(stockSummary?.currentStock)}
            sub={product.unit ? `${product.unit.name}` : undefined}
          />
          <StatCard
            icon={<Layers className="h-5 w-5 text-purple-600" />}
            iconBg="bg-purple-50"
            label="Opening Stock"
            value={fmtQty(stockSummary?.openingStock)}
            sub="Tap to edit"
            subColor="text-[#ff6d29] cursor-pointer hover:underline"
            action={
              <button
                onClick={() => setEditingOpeningStock(true)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit opening stock"
              >
                <Edit2 className="h-3.5 w-3.5 text-gray-400" />
              </button>
            }
          />
          <StatCard
            icon={<ShoppingCart className="h-5 w-5 text-green-600" />}
            iconBg="bg-green-50"
            label="Total Sales"
            value={`৳${fmt(salesSummary?.total_sales_amount)}`}
            sub={`${fmtQty(salesSummary?.total_qty_sold)} units · ${salesSummary?.total_orders ?? 0} orders`}
          />
          <StatCard
            icon={<TrendingDown className="h-5 w-5 text-blue-600" />}
            iconBg="bg-blue-50"
            label="Total Purchased"
            value={`৳${fmt(purchaseSummary?.total_purchase_amount)}`}
            sub={`${fmtQty(purchaseSummary?.total_qty_purchased)} units · ${purchaseSummary?.total_orders ?? 0} orders`}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            iconBg="bg-emerald-50"
            label="Total Profit"
            value={`৳${fmt(salesSummary?.total_profit)}`}
            sub={
              Number(salesSummary?.total_sales_amount) > 0
                ? `Margin: ${((Number(salesSummary?.total_profit) / Number(salesSummary?.total_sales_amount)) * 100).toFixed(1)}%`
                : undefined
            }
            subColor="text-emerald-600"
          />
          <StatCard
            icon={<Tag className="h-5 w-5 text-orange-500" />}
            iconBg="bg-orange-50"
            label="Alert Quantity"
            value={product.alertQuantity != null ? fmtQty(product.alertQuantity) : '—'}
            sub={
              Number(stockSummary?.currentStock) <= Number(product.alertQuantity ?? Infinity) &&
              product.alertQuantity != null
                ? 'Low stock!'
                : undefined
            }
            subColor="text-red-500 font-semibold"
          />
        </div>
      </div>

      {/* ── Description ── */}
      {product.description && (
        <div className="mb-6 bg-white border border-[#DBDFE9] rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Description</p>
          <p className="text-sm text-gray-600">{product.description}</p>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm">
        <div className="border-b border-[#DBDFE9] px-5 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-[#ff6d29] text-[#ff6d29]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sales Summary */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <ShoppingCart className="h-3.5 w-3.5" /> Sales Summary
                </p>
                <div className="space-y-3">
                  {[
                    { label: 'Total Orders', value: salesSummary?.total_orders ?? 0 },
                    { label: 'Total Qty Sold', value: fmtQty(salesSummary?.total_qty_sold) },
                    { label: 'Total Sales Amount', value: `৳${fmt(salesSummary?.total_sales_amount)}` },
                    { label: 'Total Profit', value: `৳${fmt(salesSummary?.total_profit)}` },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                      <span className="text-gray-500">{row.label}</span>
                      <span className="font-semibold text-[#26272F]">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Purchase Summary */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <TrendingDown className="h-3.5 w-3.5" /> Purchase Summary
                </p>
                <div className="space-y-3">
                  {[
                    { label: 'Total Orders', value: purchaseSummary?.total_orders ?? 0 },
                    { label: 'Total Qty Purchased', value: fmtQty(purchaseSummary?.total_qty_purchased) },
                    { label: 'Total Purchase Amount', value: `৳${fmt(purchaseSummary?.total_purchase_amount)}` },
                    { label: 'Avg Purchase Price', value: `৳${fmt(product.purchasePrice)}` },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                      <span className="text-gray-500">{row.label}</span>
                      <span className="font-semibold text-[#26272F]">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock Summary */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <BoxIcon className="h-3.5 w-3.5" /> Stock Summary
                </p>
                <div className="space-y-3">
                  {[
                    { label: 'Opening Stock', value: fmtQty(stockSummary?.openingStock) },
                    { label: 'Total In', value: fmtQty(stockSummary?.stockRows?.[0]?.inQty) },
                    { label: 'Total Out', value: fmtQty(stockSummary?.stockRows?.[0]?.outQty) },
                    { label: 'Current Stock', value: fmtQty(stockSummary?.currentStock) },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                      <span className="text-gray-500">{row.label}</span>
                      <span className="font-semibold text-[#26272F]">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5" /> Pricing
                </p>
                <div className="space-y-3">
                  {[
                    { label: 'Purchase Price', value: `৳${fmt(product.purchasePrice)}` },
                    { label: 'Selling Price', value: `৳${fmt(product.sellingPrice)}` },
                    { label: 'Wholesale Price', value: product.wholesalePrice ? `৳${fmt(product.wholesalePrice)}` : '—' },
                    {
                      label: 'Margin',
                      value:
                        Number(product.sellingPrice) > 0
                          ? `${(((Number(product.sellingPrice) - Number(product.purchasePrice)) / Number(product.sellingPrice)) * 100).toFixed(1)}%`
                          : '—',
                    },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                      <span className="text-gray-500">{row.label}</span>
                      <span className="font-semibold text-[#26272F]">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Sales Tab ── */}
        {activeTab === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                  {['#', 'Date', 'Invoice', 'Customer', 'Sold By', 'Qty', 'Unit Price', 'Discount', 'Total', 'Profit', 'Status'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salesHistory?.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-16 text-center">
                      <ShoppingCart className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                      <p className="text-gray-400">No sales recorded for this product</p>
                    </td>
                  </tr>
                ) : (
                  salesHistory?.map((s: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(s.sale_date)}</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/sales/${s.sale_id}`}
                          className="font-mono text-xs font-medium text-[#ff6d29] hover:underline"
                        >
                          {s.invoice_no}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{s.customer_name || <span className="text-gray-400">Walk-in</span>}</td>
                      <td className="px-4 py-3 text-gray-600">{s.sold_by || <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-3 font-medium text-[#26272F]">{fmtQty(s.quantity)}</td>
                      <td className="px-4 py-3 text-gray-700">৳{fmt(s.unit_price)}</td>
                      <td className="px-4 py-3">
                        {Number(s.discount_amount) > 0 ? (
                          <span className="text-green-600">-৳{fmt(s.discount_amount)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#26272F]">৳{fmt(s.total)}</td>
                      <td className="px-4 py-3">
                        <span className={Number(s.profit) >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                          ৳{fmt(s.profit)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={s.payment_status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {salesHistory?.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-[#DBDFE9]">
                    <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Total ({salesHistory.length} records)
                    </td>
                    <td className="px-4 py-3 font-bold text-[#26272F]">
                      {fmtQty(salesHistory.reduce((s: number, r: any) => s + Number(r.quantity), 0))}
                    </td>
                    <td />
                    <td />
                    <td className="px-4 py-3 font-bold text-[#26272F]">
                      ৳{fmt(salesHistory.reduce((s: number, r: any) => s + Number(r.total), 0))}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600">
                      ৳{fmt(salesHistory.reduce((s: number, r: any) => s + Number(r.profit), 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* ── Purchases Tab ── */}
        {activeTab === 'purchases' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                  {['#', 'Date', 'Invoice', 'Supplier', 'Purchased By', 'Qty', 'Unit Cost', 'Discount', 'Total', 'Status'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchaseHistory?.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <List className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                      <p className="text-gray-400">No purchases recorded for this product</p>
                    </td>
                  </tr>
                ) : (
                  purchaseHistory?.map((p: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(p.purchase_date)}</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/purchase/${p.purchase_id}`}
                          className="font-mono text-xs font-medium text-[#ff6d29] hover:underline"
                        >
                          {p.invoice_no}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{p.supplier_name || <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-3 text-gray-600">{p.purchased_by || <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-3 font-medium text-[#26272F]">{fmtQty(p.quantity)}</td>
                      <td className="px-4 py-3 text-gray-700">৳{fmt(p.unit_cost)}</td>
                      <td className="px-4 py-3">
                        {Number(p.discount_amount) > 0 ? (
                          <span className="text-green-600">-৳{fmt(p.discount_amount)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#26272F]">৳{fmt(p.total)}</td>
                      <td className="px-4 py-3">
                        <Badge status={p.payment_status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {purchaseHistory?.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-[#DBDFE9]">
                    <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Total ({purchaseHistory.length} records)
                    </td>
                    <td className="px-4 py-3 font-bold text-[#26272F]">
                      {fmtQty(purchaseHistory.reduce((s: number, r: any) => s + Number(r.quantity), 0))}
                    </td>
                    <td />
                    <td />
                    <td className="px-4 py-3 font-bold text-[#26272F]">
                      ৳{fmt(purchaseHistory.reduce((s: number, r: any) => s + Number(r.total), 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* ── Ledger Tab ── */}
        {activeTab === 'ledger' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                  {['#', 'Date', 'Type', 'Reference', 'Qty In', 'Qty Out', 'Balance', 'Unit Cost', 'Total Cost', 'Note'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ledger?.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <BookOpen className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                      <p className="text-gray-400">No ledger entries found</p>
                    </td>
                  </tr>
                ) : (
                  ledger?.map((entry: any, i: number) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(entry.createdAt)}</td>
                      <td className="px-4 py-3">
                        <TxBadge type={entry.transactionType} />
                      </td>
                      <td className="px-4 py-3">
                        {entry.referenceId ? (
                          <span className="font-mono text-xs text-gray-500">{entry.referenceType}/{entry.referenceId.slice(0, 8)}…</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {Number(entry.qtyIn) > 0 ? (
                          <span className="text-blue-600 font-medium">+{fmtQty(entry.qtyIn)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {Number(entry.qtyOut) > 0 ? (
                          <span className="text-red-500 font-medium">-{fmtQty(entry.qtyOut)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#26272F]">{fmtQty(entry.balanceAfter)}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {entry.unitCost != null ? `৳${fmt(entry.unitCost)}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {entry.totalCost != null ? `৳${fmt(entry.totalCost)}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[150px] truncate">{entry.note || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
