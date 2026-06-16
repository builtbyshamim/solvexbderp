import { Download, Package } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import { useGetStockValuationQuery } from './reportsApi';

const StockReportPage = () => {
  const { t } = useLanguage();
  const { data, isFetching } = useGetStockValuationQuery();
  const items = data ?? [];

  const totalValue = items.reduce((s: number, i: any) => s + Number(i.totalValue ?? i.value ?? 0), 0);
  const totalQty = items.reduce((s: number, i: any) => s + Number(i.currentQty ?? i.quantity ?? 0), 0);
  const lowStockCount = items.filter((i: any) => Number(i.currentQty ?? 0) <= Number(i.alertQuantity ?? 0) && i.alertQuantity).length;

  return (
    <div>
      <PageHeader
        title={t('reports.stockReport.title')}
        subtitle="Current stock valuation report"
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: 'Reports' },
          { label: t('reports.stockReport.title') },
        ]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">Total Products</p>
          <p className="text-2xl font-bold text-[#26272F] mt-1">{items.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-600">Total Stock Value</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">৳{totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-red-500">Low Stock Items</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{lowStockCount}</p>
        </div>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#26272F]">Stock Valuation</h3>
          {isFetching && <div className="w-4 h-4 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Product', 'SKU', 'Category', 'Qty', 'Avg Cost', 'Total Value', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isFetching ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center">
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" /></div>
                </td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                  <Package className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                  No stock data available
                </td></tr>
              ) : items.map((item: any, i: number) => {
                const qty = Number(item.currentQty ?? item.quantity ?? 0);
                const alertQty = Number(item.alertQuantity ?? 0);
                const isLow = alertQty > 0 && qty <= alertQty;
                return (
                  <tr key={item.id ?? i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#26272F]">{item.name}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{item.sku ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{item.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-[#26272F]">{qty}</td>
                    <td className="px-4 py-3 text-gray-600">৳{Number(item.avgCost ?? item.purchasePrice ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-blue-700">৳{Number(item.totalValue ?? item.value ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {isLow ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-500">Low Stock</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Normal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockReportPage;
