import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MapPin, Printer, Loader2,
  Search, X, ShoppingBag, Wallet, TrendingUp, FileText,
} from 'lucide-react';
import moment from 'moment';
import PageHeader from '../../../components/shared/PageHeader';
import {
  useGetSupplierQuery,
  useGetAllPurchasesQuery,
  useGetPurchaseQuery,
  useGetSupplierLedgerQuery,
} from '../purchaseApi';

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: any) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d: any) => d ? moment(d).format('DD MMM YYYY') : '—';

const statusColor: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  unpaid: 'bg-red-100 text-red-600',
};

const PayBadge = ({ status }: { status: string }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-500'}`}>
    {status?.toUpperCase()}
  </span>
);

// ─── purchase receipt print window ───────────────────────────────────────────

function openPurchasePrintWindow(purchase: any) {
  const win = window.open('', '_blank', 'width=900,height=720');
  if (!win) { alert('Please allow pop-ups to print receipts.'); return; }

  const rows = (purchase.items ?? []).map((item: any) => `
    <tr>
      <td>${item.product?.name || '—'}</td>
      <td class="center">${Number(item.quantity).toFixed(2)}</td>
      <td class="right">৳${fmt(item.unitCost)}</td>
      <td class="right">${Number(item.discountAmount) > 0 ? '-৳' + fmt(item.discountAmount) : '—'}</td>
      <td class="right bold">৳${fmt(item.total)}</td>
    </tr>`).join('');

  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Purchase ${purchase.invoiceNo}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;font-size:13px;color:#333;padding:32px;max-width:800px;margin:auto}
    .header{text-align:center;padding-bottom:18px;border-bottom:2px solid #222;margin-bottom:24px}
    .header h1{font-size:26px;font-weight:900;letter-spacing:3px;color:#111}
    .meta{display:flex;justify-content:space-between;margin-bottom:24px}
    .meta .left p,.meta .right p{margin-bottom:3px;font-size:13px}
    .meta .right{text-align:right}
    .inv-no{font-size:18px;font-weight:bold;margin-bottom:6px}
    table{width:100%;border-collapse:collapse;margin-top:4px}
    thead tr{background:#f4f4f4;border-bottom:2px solid #ddd}
    thead th{padding:10px 8px;font-size:11px;text-transform:uppercase;color:#555;font-weight:700;text-align:left}
    tbody td{padding:9px 8px;border-bottom:1px solid #eee;vertical-align:top}
    .center{text-align:center}.right{text-align:right}.bold{font-weight:bold}
    .totals{margin-top:20px;width:260px;margin-left:auto}
    .totals .row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee;font-size:13px}
    .totals .grand{font-size:16px;font-weight:900;border-top:2px solid #222;border-bottom:none;padding-top:10px;margin-top:4px}
    .totals .due{color:#dc2626;font-weight:700}
    .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:bold;text-transform:uppercase}
    .paid{background:#dcfce7;color:#16a34a}.partial{background:#fef9c3;color:#ca8a04}.unpaid{background:#fee2e2;color:#dc2626}
    .note-box{margin-top:20px;padding:12px;background:#f9f9f9;border-left:3px solid #1d4ed8;border-radius:4px;font-size:12px;color:#555}
    .footer{text-align:center;margin-top:40px;padding-top:16px;border-top:1px dashed #ccc;font-size:11px;color:#888}
    @media print{body{padding:10px}}
  </style>
  </head><body>
  <div class="header">
    <h1>PURCHASE ORDER</h1>
  </div>
  <div class="meta">
    <div class="left">
      <p style="font-size:11px;text-transform:uppercase;color:#999;margin-bottom:6px">Supplier</p>
      <p style="font-weight:bold;font-size:15px">${purchase.supplier?.name || '—'}</p>
      ${purchase.supplier?.company ? `<p style="color:#666">${purchase.supplier.company}</p>` : ''}
      ${purchase.supplier?.phone ? `<p>${purchase.supplier.phone}</p>` : ''}
    </div>
    <div class="right">
      <p class="inv-no">${purchase.invoiceNo}</p>
      <p>Date: ${fmtDate(purchase.purchaseDate)}</p>
      ${purchase.note ? `<p>Note: ${purchase.note}</p>` : ''}
      <p style="margin-top:8px"><span class="badge ${purchase.paymentStatus?.toLowerCase()}">${purchase.paymentStatus?.toUpperCase() || ''}</span></p>
    </div>
  </div>
  <table>
    <thead><tr>
      <th>Product</th>
      <th class="center">Qty</th>
      <th class="right">Unit Cost</th>
      <th class="right">Discount</th>
      <th class="right">Total</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#999">No items</td></tr>'}</tbody>
  </table>
  <div class="totals">
    <div class="row"><span>Subtotal</span><span>৳${fmt(purchase.subtotal)}</span></div>
    ${Number(purchase.discountAmount) > 0 ? `<div class="row"><span>Discount</span><span style="color:#16a34a">-৳${fmt(purchase.discountAmount)}</span></div>` : ''}
    ${Number(purchase.taxAmount) > 0 ? `<div class="row"><span>Tax</span><span>+৳${fmt(purchase.taxAmount)}</span></div>` : ''}
    ${Number(purchase.shippingCost) > 0 ? `<div class="row"><span>Shipping</span><span>+৳${fmt(purchase.shippingCost)}</span></div>` : ''}
    <div class="row grand"><span>Grand Total</span><span>৳${fmt(purchase.grandTotal)}</span></div>
    <div class="row"><span>Paid Amount</span><span style="color:#16a34a">৳${fmt(purchase.paidAmount)}</span></div>
    ${Number(purchase.dueAmount) > 0 ? `<div class="row due"><span>Due Amount</span><span>৳${fmt(purchase.dueAmount)}</span></div>` : ''}
  </div>
  ${purchase.note ? `<div class="note-box"><strong>Note:</strong> ${purchase.note}</div>` : ''}
  <div class="footer">
    <p>Purchase Order Receipt</p>
    <p style="margin-top:4px">Printed on ${moment().format('DD MMM YYYY, h:mm A')}</p>
  </div>
  <script>window.onload=function(){window.print()}</script>
  </body></html>`);
  win.document.close();
}

// ─── ReceiptPreview (in-modal) ────────────────────────────────────────────────

const ReceiptPreview = ({ purchase }: { purchase: any }) => (
  <div className="text-sm font-sans">
    <div className="text-center pb-4 border-b-2 border-gray-800 mb-5">
      <p className="text-xl font-black tracking-widest">PURCHASE ORDER</p>
    </div>
    <div className="flex justify-between mb-5 gap-4">
      <div>
        <p className="text-xs uppercase text-gray-400 mb-1">Supplier</p>
        <p className="font-bold text-base">{purchase.supplier?.name || '—'}</p>
        {purchase.supplier?.company && <p className="text-gray-500 text-xs">{purchase.supplier.company}</p>}
        {purchase.supplier?.phone && <p className="text-gray-600">{purchase.supplier.phone}</p>}
      </div>
      <div className="text-right">
        <p className="text-lg font-bold mb-1">{purchase.invoiceNo}</p>
        <p className="text-gray-600">Date: {fmtDate(purchase.purchaseDate)}</p>
        <div className="mt-2"><PayBadge status={purchase.paymentStatus} /></div>
      </div>
    </div>
    <table className="w-full text-xs mb-4">
      <thead>
        <tr className="bg-gray-50 border-b-2 border-gray-200">
          <th className="py-2 px-3 text-left text-gray-500 uppercase font-semibold">Product</th>
          <th className="py-2 px-3 text-center text-gray-500 uppercase font-semibold">Qty</th>
          <th className="py-2 px-3 text-right text-gray-500 uppercase font-semibold">Cost</th>
          <th className="py-2 px-3 text-right text-gray-500 uppercase font-semibold">Disc</th>
          <th className="py-2 px-3 text-right text-gray-500 uppercase font-semibold">Total</th>
        </tr>
      </thead>
      <tbody>
        {(purchase.items ?? []).map((item: any, i: number) => (
          <tr key={i} className="border-b border-gray-100">
            <td className="py-2 px-3">{item.product?.name || '—'}</td>
            <td className="py-2 px-3 text-center">{Number(item.quantity).toFixed(2)}</td>
            <td className="py-2 px-3 text-right">৳{fmt(item.unitCost)}</td>
            <td className="py-2 px-3 text-right">{Number(item.discountAmount) > 0 ? `-৳${fmt(item.discountAmount)}` : '—'}</td>
            <td className="py-2 px-3 text-right font-semibold">৳{fmt(item.total)}</td>
          </tr>
        ))}
        {!(purchase.items ?? []).length && (
          <tr><td colSpan={5} className="py-6 text-center text-gray-400">No items</td></tr>
        )}
      </tbody>
    </table>
    <div className="ml-auto w-64 space-y-1 text-sm">
      <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Subtotal</span><span>৳{fmt(purchase.subtotal)}</span></div>
      {Number(purchase.discountAmount) > 0 && <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Discount</span><span className="text-green-600">-৳{fmt(purchase.discountAmount)}</span></div>}
      {Number(purchase.taxAmount) > 0 && <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Tax</span><span>+৳{fmt(purchase.taxAmount)}</span></div>}
      {Number(purchase.shippingCost) > 0 && <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Shipping</span><span>+৳{fmt(purchase.shippingCost)}</span></div>}
      <div className="flex justify-between py-2 font-bold text-base border-t-2 border-gray-800"><span>Grand Total</span><span>৳{fmt(purchase.grandTotal)}</span></div>
      <div className="flex justify-between py-1 text-green-600"><span>Paid</span><span>৳{fmt(purchase.paidAmount)}</span></div>
      {Number(purchase.dueAmount) > 0 && <div className="flex justify-between py-1 text-red-600 font-semibold"><span>Due</span><span>৳{fmt(purchase.dueAmount)}</span></div>}
    </div>
    {purchase.note && <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-xs text-gray-600 rounded-r"><strong>Note:</strong> {purchase.note}</div>}
    <div className="text-center mt-6 pt-4 border-t border-dashed border-gray-300 text-xs text-gray-400">
      <p>Purchase Order Receipt</p>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const SupplierDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'purchases' | 'ledger'>('purchases');
  const [page, setPage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dSearch, setDSearch] = useState('');
  const [receiptPurchaseId, setReceiptPurchaseId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data: supplier, isLoading: suppLoading } = useGetSupplierQuery(id!);
  const { data: purchasesData, isFetching: purchFetching } = useGetAllPurchasesQuery({
    supplierId: id, page, limit: 15, search: dSearch,
  }, { skip: !id });
  const { data: ledgerData, isFetching: ledgerFetching } = useGetSupplierLedgerQuery(
    { supplierId: id!, page: ledgerPage, limit: 20 },
    { skip: activeTab !== 'ledger' || !id },
  );
  const { data: receiptPurchase, isFetching: receiptLoading } = useGetPurchaseQuery(
    receiptPurchaseId!,
    { skip: !receiptPurchaseId },
  );

  const purchases = purchasesData?.data ?? [];
  const meta = purchasesData?.meta;
  const ledgerEntries = ledgerData?.data ?? [];
  const ledgerMeta = ledgerData?.meta;

  if (suppLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff6d29]" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg font-medium">Supplier not found</p>
        <Link to="/admin/purchase/suppliers" className="text-[#ff6d29] text-sm mt-2 inline-block">← Back to suppliers</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Receipt Preview Modal */}
      {receiptPurchaseId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-[#26272F]">Purchase Receipt Preview</h3>
              <div className="flex items-center gap-2">
                {receiptPurchase && !receiptLoading && (
                  <button
                    onClick={() => openPurchasePrintWindow(receiptPurchase)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]"
                  >
                    <Printer className="h-4 w-4" /> Print
                  </button>
                )}
                <button
                  onClick={() => setReceiptPurchaseId(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {receiptLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-[#ff6d29]" />
                </div>
              ) : receiptPurchase ? (
                <ReceiptPreview purchase={receiptPurchase} />
              ) : null}
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title={supplier.name}
        subtitle="Supplier Details & Purchase History"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Suppliers', path: '/admin/purchase/suppliers' },
          { label: supplier.name },
        ]}
        actions={
          <Link
            to="/admin/purchase/suppliers"
            className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        }
      />

      {/* Profile + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-white border border-[#DBDFE9] rounded-xl p-5">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <span className="text-xl font-bold text-blue-600">{supplier.name.charAt(0).toUpperCase()}</span>
          </div>
          <p className="text-lg font-bold text-[#26272F]">{supplier.name}</p>
          {supplier.company && <p className="text-sm text-gray-500 mt-0.5">{supplier.company}</p>}
          <div className="mt-3 space-y-2">
            {supplier.phone && (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Phone className="h-3.5 w-3.5 text-gray-400" />{supplier.phone}
              </div>
            )}
            {supplier.email && (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Mail className="h-3.5 w-3.5 text-gray-400" />{supplier.email}
              </div>
            )}
            {supplier.address && (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />{supplier.address}
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">Opening Balance</p>
            <p className="font-semibold text-gray-700">৳{fmt(supplier.openingBalance)}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#DBDFE9] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-indigo-600" />
              </div>
              <p className="text-sm text-gray-500">Total Orders</p>
            </div>
            <p className="text-2xl font-bold text-[#26272F]">{meta?.totalItems ?? 0}</p>
          </div>
          <div className="bg-white border border-[#DBDFE9] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-500">Current Balance</p>
            </div>
            <p className={`text-2xl font-bold ${Number(supplier.currentBalance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ৳{fmt(supplier.currentBalance)}
            </p>
          </div>
          <div className="bg-white border border-[#DBDFE9] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-sm text-gray-500">Payable</p>
            </div>
            <p className={`text-2xl font-bold ${Number(supplier.currentBalance) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              ৳{Number(supplier.currentBalance) > 0 ? fmt(supplier.currentBalance) : '0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm">
        <div className="border-b border-[#DBDFE9] px-5 flex gap-1">
          {(['purchases', 'ledger'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3.5 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-[#ff6d29] text-[#ff6d29]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'purchases' ? 'Purchase History' : 'Supplier Ledger'}
            </button>
          ))}
        </div>

        {/* ── Purchases Tab ── */}
        {activeTab === 'purchases' && (
          <>
            <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by invoice…"
                  className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                />
              </div>
              <span className="text-sm text-gray-400">{meta?.totalItems ?? 0} orders</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                    {['#', 'Date', 'Invoice', 'Total', 'Paid', 'Due', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchFetching ? (
                    <tr><td colSpan={8} className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" /></td></tr>
                  ) : purchases.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <FileText className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                        <p className="text-gray-400">No purchases found</p>
                      </td>
                    </tr>
                  ) : (
                    purchases.map((p: any, i: number) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-400">{(page - 1) * 15 + i + 1}</td>
                        <td className="px-4 py-3 text-gray-600">{fmtDate(p.purchaseDate)}</td>
                        <td className="px-4 py-3 font-mono text-xs font-medium text-[#26272F]">{p.invoiceNo}</td>
                        <td className="px-4 py-3 font-semibold">৳{fmt(p.grandTotal)}</td>
                        <td className="px-4 py-3 text-green-600">৳{fmt(p.paidAmount)}</td>
                        <td className="px-4 py-3">
                          {Number(p.dueAmount) > 0
                            ? <span className="text-red-600 font-medium">৳{fmt(p.dueAmount)}</span>
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3"><PayBadge status={p.paymentStatus} /></td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setReceiptPurchaseId(p.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#DBDFE9] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Printer className="h-3.5 w-3.5" /> Receipt
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {meta && meta.totalPages > 1 && (
              <div className="p-4 border-t border-[#DBDFE9] flex items-center justify-between">
                <span className="text-sm text-gray-500">Page {meta.currentPage} of {meta.totalPages}</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 text-sm border border-[#DBDFE9] rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
                  <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 text-sm border border-[#DBDFE9] rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Ledger Tab ── */}
        {activeTab === 'ledger' && (
          <>
            <div className="p-4 border-b border-[#DBDFE9] flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <p className="text-sm text-gray-500">Purchase ledger for <span className="font-medium text-[#26272F]">{supplier.name}</span></p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                    {['Date', 'Reference', 'Type', 'Debit (Purchase)', 'Credit (Paid)', 'Balance', 'Note'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ledgerFetching ? (
                    <tr><td colSpan={7} className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" /></td></tr>
                  ) : ledgerEntries.length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-gray-400">No ledger entries found</td></tr>
                  ) : (
                    ledgerEntries.map((e: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600">{fmtDate(e.date)}</td>
                        <td className="px-4 py-3 font-mono text-xs font-medium">{e.referenceId || e.reference || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                            {e.transactionType || e.type || 'purchase'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-red-600">{e.debit > 0 ? `৳${fmt(e.debit)}` : '—'}</td>
                        <td className="px-4 py-3 text-green-600">{e.credit > 0 ? `৳${fmt(e.credit)}` : '—'}</td>
                        <td className="px-4 py-3 font-semibold">
                          {(e.balanceAfter ?? e.balance) >= 0
                            ? `৳${fmt(e.balanceAfter ?? e.balance)}`
                            : `-৳${fmt(Math.abs(e.balanceAfter ?? e.balance))}`}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{e.note || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {ledgerMeta && ledgerMeta.totalPages > 1 && (
              <div className="p-4 border-t border-[#DBDFE9] flex items-center justify-between">
                <span className="text-sm text-gray-500">Page {ledgerMeta.currentPage} of {ledgerMeta.totalPages}</span>
                <div className="flex gap-2">
                  <button disabled={ledgerPage <= 1} onClick={() => setLedgerPage(p => p - 1)}
                    className="px-3 py-1.5 text-sm border border-[#DBDFE9] rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
                  <button disabled={ledgerPage >= ledgerMeta.totalPages} onClick={() => setLedgerPage(p => p + 1)}
                    className="px-3 py-1.5 text-sm border border-[#DBDFE9] rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
                </div>
              </div>
            )}
            <div className="p-4 border-t border-[#DBDFE9] flex justify-end bg-gray-50">
              <div className="text-sm font-semibold">
                Current Payable: <span className={Number(supplier.currentBalance) > 0 ? 'text-red-600' : 'text-green-600'}>
                  ৳{fmt(supplier.currentBalance)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SupplierDetail;
