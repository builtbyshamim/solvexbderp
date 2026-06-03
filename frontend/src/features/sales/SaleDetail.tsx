import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, Receipt, Loader2, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useGetSaleQuery, useCollectPaymentMutation } from './salesApi';

const paymentColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  unpaid: 'bg-red-100 text-red-500',
};

const statusColors: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-gray-200 text-gray-500',
};

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
];

const fmtN = (n: number | string) =>
  Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SaleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useGetSaleQuery(id!, { skip: !id });
  const [collectPayment, { isLoading: isCollecting }] = useCollectPaymentMutation();

  const [showPayForm, setShowPayForm] = useState(false);
  const [payMethod, setPayMethod] = useState('cash');
  const [payAmount, setPayAmount] = useState('');

  const sale = data?.data ?? data;

  const openPrintWindow = (type: 'a4' | 'pos') => {
    window.open(`/print/invoice/${type}/${id}`, '_blank', 'width=900,height=700');
  };

  const handleCollectPayment = async () => {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      await collectPayment({ id: id!, data: { amount, method: payMethod } }).unwrap();
      toast.success('Payment collected');
      setShowPayForm(false);
      setPayAmount('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to collect payment');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff6d29]" />
      </div>
    );
  }

  if (isError || !sale) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>Sale not found.</p>
        <Link to="/admin/sales/list" className="text-[#ff6d29] text-sm mt-2 inline-block">← Back to list</Link>
      </div>
    );
  }

  const items: any[] = sale.items ?? sale.saleItems ?? [];
  const payments: any[] = sale.payments ?? [];

  return (
    <div>
      <PageHeader
        title={`Invoice ${sale.invoiceNo}`}
        subtitle={`Sale details and print options`}
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Sales', path: '/admin/sales/list' },
          { label: sale.invoiceNo },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openPrintWindow('a4')}
              className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors"
            >
              <Printer className="h-4 w-4" /> Print A4 Invoice
            </button>
            <button
              onClick={() => openPrintWindow('pos')}
              className="flex items-center gap-2 px-4 py-2 border border-[#ff6d29] text-[#ff6d29] rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors"
            >
              <Receipt className="h-4 w-4" /> Print POS (58mm)
            </button>
            <Link
              to="/admin/sales/list"
              className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Items */}
        <div className="lg:col-span-2 space-y-5">

          {/* Sale Header Info */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Invoice No</p>
                <p className="font-mono font-semibold text-[#ff6d29] text-sm">{sale.invoiceNo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Date</p>
                <p className="text-sm font-medium text-[#26272F]">
                  {new Date(sale.saleDate).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Payment Status</p>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${paymentColors[sale.paymentStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                  {sale.paymentStatus}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Status</p>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[sale.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {sale.status}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#26272F] mb-3">Customer</h3>
            {sale.customer ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-medium text-[#26272F]">{sale.customer.name}</p>
                </div>
                {sale.customer.phone && (
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-[#26272F]">{sale.customer.phone}</p>
                  </div>
                )}
                {sale.customer.address && (
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-[#26272F]">{sale.customer.address}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Walk-in Customer</p>
            )}
          </div>

          {/* Items */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4">Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#DBDFE9] bg-gray-50">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Discount</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item: any, i: number) => (
                    <tr key={item.id ?? i} className="hover:bg-gray-50/50">
                      <td className="px-3 py-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-3 py-3 font-medium text-[#26272F]">
                        {item.product?.name ?? item.productName ?? '—'}
                        {item.product?.sku && (
                          <p className="text-xs text-gray-400 font-normal">{item.product.sku}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-700">{Number(item.quantity ?? item.qty).toLocaleString()}</td>
                      <td className="px-3 py-3 text-right text-gray-700">৳{fmtN(item.unitPrice)}</td>
                      <td className="px-3 py-3 text-right text-green-600">
                        {Number(item.discountAmount) > 0 ? `-৳${fmtN(item.discountAmount)}` : '—'}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-[#26272F]">৳{fmtN(item.total ?? (Number(item.quantity ?? item.qty) * Number(item.unitPrice) - Number(item.discountAmount ?? 0)))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments History */}
          {payments.length > 0 && (
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
              <h3 className="text-sm font-semibold text-[#26272F] mb-4">Payment History</h3>
              <div className="space-y-2">
                {payments.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center">
                        <CreditCard className="h-3.5 w-3.5 text-green-600" />
                      </span>
                      <div>
                        <p className="text-sm font-medium capitalize text-[#26272F]">{p.method?.replace('_', ' ') ?? 'Cash'}</p>
                        <p className="text-xs text-gray-400">{p.paidAt ? new Date(p.paidAt).toLocaleString() : ''}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-green-600">৳{fmtN(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {sale.note && (
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
              <h3 className="text-sm font-semibold text-[#26272F] mb-2">Note</h3>
              <p className="text-sm text-gray-600">{sale.note}</p>
            </div>
          )}
        </div>

        {/* Right Sidebar — Summary */}
        <div className="space-y-5">
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4">Invoice Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>৳{fmtN(sale.subtotal ?? sale.subTotal ?? 0)}</span>
              </div>
              {Number(sale.discountAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-৳{fmtN(sale.discountAmount)}</span>
                </div>
              )}
              {Number(sale.taxAmount) > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>VAT / Tax</span>
                  <span>+৳{fmtN(sale.taxAmount)}</span>
                </div>
              )}
              {Number(sale.deliveryCharge) > 0 && (
                <div className="flex justify-between text-orange-500">
                  <span>Delivery</span>
                  <span>+৳{fmtN(sale.deliveryCharge)}</span>
                </div>
              )}
              <div className="border-t border-[#DBDFE9] pt-2 mt-2 flex justify-between font-bold text-base text-[#26272F]">
                <span>Grand Total</span>
                <span>৳{fmtN(sale.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-green-600 font-medium">
                <span>Paid</span>
                <span>৳{fmtN(sale.paidAmount)}</span>
              </div>
              {Number(sale.dueAmount) > 0 && (
                <div className="flex justify-between text-red-600 font-semibold text-base">
                  <span>Due</span>
                  <span>৳{fmtN(sale.dueAmount)}</span>
                </div>
              )}
              {Number(sale.totalProfit) > 0 && (
                <div className="flex justify-between text-gray-400 text-xs border-t border-gray-100 pt-2 mt-1">
                  <span>Profit</span>
                  <span className="text-green-500">৳{fmtN(sale.totalProfit)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Collect Payment (if due exists) */}
          {Number(sale.dueAmount) > 0 && sale.status !== 'cancelled' && (
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
              <button
                onClick={() => setShowPayForm((p) => !p)}
                className="w-full flex items-center justify-between text-sm font-semibold text-[#26272F]"
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#ff6d29]" /> Collect Payment
                </span>
                {showPayForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showPayForm && (
                <div className="mt-4 space-y-3">
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">৳</span>
                    <input
                      type="number" min="0" step="0.01"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder={`Max: ${fmtN(sale.dueAmount)}`}
                      className="w-full pl-6 pr-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPayAmount(String(sale.dueAmount))}
                      className="flex-1 py-1.5 text-xs border border-[#DBDFE9] rounded-lg hover:bg-gray-50 text-gray-500"
                    >
                      Full Due
                    </button>
                    <button
                      onClick={handleCollectPayment}
                      disabled={isCollecting}
                      className="flex-1 py-1.5 text-xs bg-[#ff6d29] text-white rounded-lg hover:bg-[#e65a1f] disabled:opacity-40 flex items-center justify-center gap-1"
                    >
                      {isCollecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Collect'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Print Buttons */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#26272F]">Print Invoice</h3>
            <button
              onClick={() => openPrintWindow('a4')}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors"
            >
              <Printer className="h-4 w-4" /> Print A4 Invoice
            </button>
            <button
              onClick={() => openPrintWindow('pos')}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#ff6d29] text-[#ff6d29] rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors"
            >
              <Receipt className="h-4 w-4" /> Print POS (58mm)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleDetail;
