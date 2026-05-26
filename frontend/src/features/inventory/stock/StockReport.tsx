import { useState } from 'react';
import { Search, Download, BookOpen } from 'lucide-react';
import PageHeader from '../../../components/shared/PageHeader';

interface LedgerEntry {
  id: number;
  created_at: string;
  product: string;
  sku: string;
  warehouse: string;
  transaction_type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'OPENING';
  reference_type: string;
  reference_id: string;
  qty_in: number;
  qty_out: number;
  balance_after: number;
  note: string;
}

const ledgerData: LedgerEntry[] = [
  { id: 1, created_at: '2025-05-01 09:00', product: 'Laptop Stand', sku: 'SKU-001', warehouse: 'Main Warehouse', transaction_type: 'OPENING', reference_type: 'opening', reference_id: '—', qty_in: 50, qty_out: 0, balance_after: 50, note: 'Opening stock' },
  { id: 2, created_at: '2025-05-10 11:30', product: 'Laptop Stand', sku: 'SKU-001', warehouse: 'Main Warehouse', transaction_type: 'PURCHASE', reference_type: 'purchase', reference_id: 'PUR-001', qty_in: 30, qty_out: 0, balance_after: 80, note: '' },
  { id: 3, created_at: '2025-05-12 14:20', product: 'Laptop Stand', sku: 'SKU-001', warehouse: 'Main Warehouse', transaction_type: 'SALE', reference_type: 'sale', reference_id: 'INV-001', qty_in: 0, qty_out: 10, balance_after: 70, note: '' },
  { id: 4, created_at: '2025-05-15 10:00', product: 'USB-C Cable', sku: 'SKU-002', warehouse: 'Main Warehouse', transaction_type: 'OPENING', reference_type: 'opening', reference_id: '—', qty_in: 200, qty_out: 0, balance_after: 200, note: 'Opening stock' },
  { id: 5, created_at: '2025-05-18 09:45', product: 'USB-C Cable', sku: 'SKU-002', warehouse: 'Main Warehouse', transaction_type: 'SALE', reference_type: 'sale', reference_id: 'INV-002', qty_in: 0, qty_out: 50, balance_after: 150, note: '' },
  { id: 6, created_at: '2025-05-20 15:00', product: 'Laptop Stand', sku: 'SKU-001', warehouse: 'Main Warehouse', transaction_type: 'ADJUSTMENT_IN', reference_type: 'adjustment', reference_id: 'ADJ-001', qty_in: 5, qty_out: 0, balance_after: 75, note: 'Stock received' },
  { id: 7, created_at: '2025-05-21 11:00', product: 'USB-C Cable', sku: 'SKU-002', warehouse: 'Main Warehouse', transaction_type: 'ADJUSTMENT_OUT', reference_type: 'adjustment', reference_id: 'ADJ-002', qty_in: 0, qty_out: 5, balance_after: 145, note: 'Damaged goods' },
  { id: 8, created_at: '2025-05-22 13:30', product: 'Laptop Stand', sku: 'SKU-001', warehouse: 'Main Warehouse', transaction_type: 'TRANSFER_OUT', reference_type: 'transfer', reference_id: 'TRF-001', qty_in: 0, qty_out: 5, balance_after: 70, note: 'To Branch Store' },
  { id: 9, created_at: '2025-05-22 13:30', product: 'Laptop Stand', sku: 'SKU-001', warehouse: 'Branch Store', transaction_type: 'TRANSFER_IN', reference_type: 'transfer', reference_id: 'TRF-001', qty_in: 5, qty_out: 0, balance_after: 5, note: 'From Main Warehouse' },
];

const typeConfig: Record<string, { label: string; cls: string }> = {
  OPENING: { label: 'Opening', cls: 'bg-gray-100 text-gray-600' },
  PURCHASE: { label: 'Purchase', cls: 'bg-blue-100 text-blue-700' },
  SALE: { label: 'Sale', cls: 'bg-orange-100 text-orange-700' },
  ADJUSTMENT_IN: { label: 'Adj +', cls: 'bg-green-100 text-green-700' },
  ADJUSTMENT_OUT: { label: 'Adj −', cls: 'bg-red-100 text-red-600' },
  TRANSFER_IN: { label: 'Transfer In', cls: 'bg-purple-100 text-purple-700' },
  TRANSFER_OUT: { label: 'Transfer Out', cls: 'bg-yellow-100 text-yellow-700' },
};

const StockReport = () => {
  const [search, setSearch] = useState('');
  const [warehouse, setWarehouse] = useState('All');
  const [txType, setTxType] = useState('All');
  const [from, setFrom] = useState('2025-05-01');
  const [to, setTo] = useState('2025-05-31');

  const filtered = ledgerData.filter((e) => {
    const matchSearch = e.product.toLowerCase().includes(search.toLowerCase()) || e.sku.toLowerCase().includes(search.toLowerCase()) || e.reference_id.toLowerCase().includes(search.toLowerCase());
    const matchWarehouse = warehouse === 'All' || e.warehouse === warehouse;
    const matchType = txType === 'All' || e.transaction_type === txType;
    return matchSearch && matchWarehouse && matchType;
  });

  return (
    <div>
      <PageHeader
        title="Stock Ledger"
        subtitle="Immutable record of all stock movements"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Inventory', path: '/admin/inventory/products' },
          { label: 'Stock Ledger' },
        ]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg p-4 mb-5 flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search product, SKU, reference..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
        </div>
        <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}
          className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
          <option value="All">All Warehouses</option>
          <option>Main Warehouse</option>
          <option>Branch Store</option>
        </select>
        <select value={txType} onChange={(e) => setTxType(e.target.value)}
          className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
          <option value="All">All Types</option>
          {Object.keys(typeConfig).map((k) => <option key={k} value={k}>{typeConfig[k].label}</option>)}
        </select>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          <span>—</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
        </div>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-[#DBDFE9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#ff6d29]" />
            <span className="text-sm font-semibold text-[#26272F]">Stock Ledger</span>
            <span className="text-xs text-gray-400 ml-1">— append-only, read-only</span>
          </div>
          <span className="text-sm text-gray-500">{filtered.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Date & Time', 'Product', 'Warehouse', 'Type', 'Reference', 'In', 'Out', 'Balance', 'Note'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                  <BookOpen className="h-10 w-10 mx-auto mb-2 text-gray-300" />No ledger entries found
                </td></tr>
              ) : (
                filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{entry.created_at}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#26272F] whitespace-nowrap">{entry.product}</div>
                      <div className="text-xs text-gray-400 font-mono">{entry.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{entry.warehouse}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig[entry.transaction_type]?.cls}`}>
                        {typeConfig[entry.transaction_type]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#ff6d29] whitespace-nowrap">{entry.reference_id}</td>
                    <td className="px-4 py-3 text-green-600 font-semibold">{entry.qty_in > 0 ? `+${entry.qty_in}` : '—'}</td>
                    <td className="px-4 py-3 text-red-500 font-semibold">{entry.qty_out > 0 ? `−${entry.qty_out}` : '—'}</td>
                    <td className="px-4 py-3 font-bold text-[#26272F]">{entry.balance_after}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[120px] truncate">{entry.note || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockReport;
