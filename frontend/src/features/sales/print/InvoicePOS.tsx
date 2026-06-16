import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useGetSaleQuery } from '../salesApi';
import { useGetBusinessProfileQuery } from '../../settings/settingsApi';

const fmtN = (n: number | string) =>
  Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const divider = '--------------------------------';

const InvoicePOS = () => {
  const { id } = useParams<{ id: string }>();
  const { data: saleData, isLoading: saleLoading } = useGetSaleQuery(id!, { skip: !id });
  const { data: bizData, isLoading: bizLoading } = useGetBusinessProfileQuery(undefined);

  const sale = saleData?.data ?? saleData;
  const biz = bizData?.data ?? bizData;

  const isLoading = saleLoading || bizLoading;

  useEffect(() => {
    if (!isLoading && sale) {
      const timer = setTimeout(() => window.print(), 600);
      return () => clearTimeout(timer);
    }
  }, [isLoading, sale]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#ff6d29' }} />
      </div>
    );
  }

  if (!sale) {
    return <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>Sale not found.</div>;
  }

  const items: any[] = sale.items ?? sale.saleItems ?? [];
  const payments: any[] = sale.payments ?? [];

  const settings = (() => {
    try { return JSON.parse(localStorage.getItem('bizcore_invoice_settings') || '{}'); } catch { return {}; }
  })();

  const footerMsg = settings.invoiceFooter || 'Thank you for your purchase!';
  const bizName = biz?.name ?? biz?.businessName ?? 'BizCore ERP';
  const bizPhone = biz?.phone ?? '';
  const bizAddress = biz?.address ?? '';

  const saleDate = new Date(sale.saleDate);
  const dateStr = saleDate.toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' });

  const paymentMethodLabel = payments.length > 0
    ? payments.map((p: any) => `${p.method?.replace('_', ' ') ?? 'Cash'}: ৳${fmtN(p.amount)}`).join(', ')
    : (sale.paymentMethod?.replace('_', ' ') ?? 'Cash');

  return (
    <div id="pos-receipt">
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', Courier, monospace; background: #fff; color: #000; font-size: 12px; }
        #pos-receipt { width: 220px; margin: 0 auto; padding: 4px; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .large { font-size: 15px; }
        .small { font-size: 10px; }
        .divider { white-space: pre; line-height: 1.4; }
        .item-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .item-name { flex: 1; word-break: break-word; padding-right: 4px; }
        .item-price { white-space: nowrap; font-weight: bold; }
        .item-detail { font-size: 10px; color: #555; margin-bottom: 4px; padding-left: 2px; }
        .total-section { margin-top: 4px; }
        .total-row { display: flex; justify-content: space-between; padding: 1px 0; }
        .grand-total { font-size: 16px; font-weight: 900; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 3px 0; margin: 3px 0; }
        .paid-row { font-weight: bold; }
        .due-row { font-weight: bold; }
        .footer-section { text-align: center; margin-top: 6px; }
        .no-print { display: block; text-align: center; padding: 8px; background: #f5f5f5; margin-bottom: 6px; }
        @media print {
          @page { size: 58mm auto; margin: 2mm; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          #pos-receipt { width: 54mm; padding: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Screen-only controls */}
      <div className="no-print">
        <button
          onClick={() => window.print()}
          style={{ padding: '6px 16px', background: '#ff6d29', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, marginRight: '6px', fontSize: '12px' }}
        >
          Print Receipt
        </button>
        <button
          onClick={() => window.close()}
          style={{ padding: '6px 16px', background: '#fff', color: '#666', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
        >
          Close
        </button>
      </div>

      {/* Business Name */}
      <div className="center bold large" style={{ marginBottom: '2px' }}>{bizName}</div>
      {bizPhone && <div className="center small">{bizPhone}</div>}
      {bizAddress && <div className="center small">{bizAddress}</div>}

      <div className="divider center">{divider}</div>

      {/* Invoice Info */}
      <div style={{ marginBottom: '2px' }}>
        <div className="center bold">{sale.invoiceNo}</div>
        <div className="center small">{dateStr}  {timeStr}</div>
      </div>
      {sale.customer && (
        <div className="small" style={{ marginBottom: '2px' }}>
          <span>Customer: {sale.customer.name}</span>
          {sale.customer.phone && <span>  {sale.customer.phone}</span>}
        </div>
      )}

      <div className="divider">{divider}</div>

      {/* Items */}
      <div style={{ marginBottom: '2px' }}>
        {items.map((item: any, i: number) => {
          const qty = Number(item.quantity ?? item.qty);
          const unitPrice = Number(item.unitPrice);
          const discount = Number(item.discountAmount ?? 0);
          const total = item.total ?? (qty * unitPrice - discount);
          const name = item.product?.name ?? item.productName ?? `Item ${i + 1}`;
          return (
            <div key={item.id ?? i} style={{ marginBottom: '3px' }}>
              <div className="item-row">
                <span className="item-name bold">{name}</span>
                <span className="item-price">৳{fmtN(total)}</span>
              </div>
              <div className="item-detail">
                {qty} x ৳{fmtN(unitPrice)}
                {discount > 0 && `  -৳${fmtN(discount)}`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="divider">{divider}</div>

      {/* Totals */}
      <div className="total-section">
        <div className="total-row">
          <span>Subtotal</span>
          <span>৳{fmtN(sale.subtotal ?? sale.subTotal ?? 0)}</span>
        </div>
        {Number(sale.discountAmount) > 0 && (
          <div className="total-row">
            <span>Discount</span>
            <span>-৳{fmtN(sale.discountAmount)}</span>
          </div>
        )}
        {Number(sale.taxAmount) > 0 && (
          <div className="total-row">
            <span>VAT/Tax</span>
            <span>+৳{fmtN(sale.taxAmount)}</span>
          </div>
        )}
        {Number(sale.deliveryCharge) > 0 && (
          <div className="total-row">
            <span>Delivery</span>
            <span>+৳{fmtN(sale.deliveryCharge)}</span>
          </div>
        )}
        <div className="total-row grand-total">
          <span>TOTAL</span>
          <span>৳{fmtN(sale.grandTotal)}</span>
        </div>
        <div className="total-row paid-row">
          <span>Paid</span>
          <span>৳{fmtN(sale.paidAmount)}</span>
        </div>
        {Number(sale.dueAmount) > 0 && (
          <div className="total-row due-row">
            <span>Due</span>
            <span>৳{fmtN(sale.dueAmount)}</span>
          </div>
        )}
      </div>

      <div className="divider" style={{ marginTop: '4px' }}>{divider}</div>

      {/* Payment Method */}
      <div className="small" style={{ marginBottom: '2px' }}>
        <div>Payment: {paymentMethodLabel}</div>
      </div>

      {/* Notes */}
      {sale.note && (
        <div className="small" style={{ marginBottom: '2px', fontStyle: 'italic' }}>
          Note: {sale.note}
        </div>
      )}

      <div className="divider">{divider}</div>

      {/* Footer */}
      <div className="footer-section">
        <div className="bold" style={{ marginBottom: '2px' }}>{footerMsg}</div>
        <div className="small">{bizName}</div>
        <div className="small" style={{ marginTop: '4px' }}>
          {dateStr} · {timeStr}
        </div>
      </div>

      {/* Extra space for paper tear */}
      <div style={{ height: '12mm' }} />
    </div>
  );
};

export default InvoicePOS;
