import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useGetSaleQuery } from '../salesApi';
import { useGetBusinessProfileQuery } from '../../settings/settingsApi';

const fmtN = (n: number | string) =>
  Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const InvoiceA4 = () => {
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
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff6d29]" />
      </div>
    );
  }

  if (!sale) {
    return <div className="p-8 text-center text-gray-500">Sale not found.</div>;
  }

  const items: any[] = sale.items ?? sale.saleItems ?? [];
  const payments: any[] = sale.payments ?? [];
  const settings = (() => {
    try { return JSON.parse(localStorage.getItem('bizcore_invoice_settings') || '{}'); } catch { return {}; }
  })();

  const invoiceFooter = settings.invoiceFooter || 'Thank you for your business!';
  const terms = settings.terms || '';
  const showBankDetails = settings.showBankDetails && settings.bankName;

  return (
    <div className="invoice-a4">
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; font-size: 13px; }
        .invoice-a4 { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 12mm 14mm; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 8mm; border-bottom: 2px solid #ff6d29; margin-bottom: 8mm; }
        .biz-name { font-size: 22px; font-weight: 700; color: #1a1a2e; }
        .biz-sub { font-size: 11px; color: #666; margin-top: 3px; }
        .invoice-title { text-align: right; }
        .invoice-title h1 { font-size: 26px; font-weight: 800; color: #ff6d29; letter-spacing: 2px; }
        .invoice-title p { font-size: 11px; color: #666; margin-top: 3px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-bottom: 8mm; }
        .info-box { background: #f9f9fb; border-left: 3px solid #ff6d29; padding: 4mm 5mm; border-radius: 3px; }
        .info-box h4 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #ff6d29; margin-bottom: 3mm; }
        .info-box p { font-size: 11.5px; color: #333; line-height: 1.5; }
        .info-box .label { font-size: 10px; color: #888; margin-right: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 6mm; }
        thead tr { background: #1a1a2e; color: #fff; }
        thead th { padding: 3mm 4mm; font-size: 10.5px; font-weight: 600; text-align: left; text-transform: uppercase; letter-spacing: 0.5px; }
        thead th:not(:first-child) { text-align: right; }
        tbody tr { border-bottom: 1px solid #f0f0f0; }
        tbody tr:nth-child(even) { background: #fafafa; }
        tbody td { padding: 3mm 4mm; font-size: 12px; }
        tbody td:not(:first-child) { text-align: right; }
        .product-name { font-weight: 600; color: #1a1a2e; }
        .product-sku { font-size: 10px; color: #999; margin-top: 1px; }
        .totals { display: flex; justify-content: flex-end; margin-bottom: 6mm; }
        .totals-table { width: 220px; }
        .totals-table tr td { padding: 2mm 3mm; font-size: 12px; }
        .totals-table tr td:last-child { text-align: right; font-weight: 600; }
        .total-row td { font-size: 15px; font-weight: 800; color: #ff6d29; border-top: 2px solid #ff6d29; padding-top: 3mm; }
        .due-row td { color: #e53e3e; font-size: 13px; font-weight: 700; }
        .paid-row td { color: #38a169; }
        .payments { margin-bottom: 6mm; }
        .payments h4 { font-size: 11px; font-weight: 700; color: #444; margin-bottom: 3mm; text-transform: uppercase; letter-spacing: 0.5px; }
        .pay-entry { display: flex; justify-content: space-between; font-size: 11.5px; padding: 1.5mm 0; border-bottom: 1px dashed #eee; }
        .footer { border-top: 1px solid #e2e2e2; padding-top: 5mm; text-align: center; }
        .footer-msg { font-size: 13px; font-weight: 600; color: #ff6d29; margin-bottom: 2mm; }
        .footer-terms { font-size: 10.5px; color: #888; }
        .bank-details { background: #f9f9fb; border: 1px solid #e2e2e2; border-radius: 3px; padding: 3mm 4mm; margin-bottom: 5mm; }
        .bank-details h4 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 2mm; }
        .bank-details p { font-size: 11px; color: #444; line-height: 1.6; }
        .status-badge { display: inline-block; padding: 1mm 3mm; border-radius: 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .status-paid { background: #d4edda; color: #155724; }
        .status-partial { background: #fff3cd; color: #856404; }
        .status-unpaid { background: #f8d7da; color: #721c24; }
        @media print {
          @page { size: A4; margin: 0; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .invoice-a4 { margin: 0; padding: 12mm 14mm; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Print button — hidden when printing */}
      <div className="no-print" style={{ padding: '8px', background: '#f5f5f5', display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
        <button
          onClick={() => window.print()}
          style={{ padding: '8px 20px', background: '#ff6d29', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
        >
          Print Invoice
        </button>
        <button
          onClick={() => window.close()}
          style={{ padding: '8px 20px', background: '#fff', color: '#666', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}
        >
          Close
        </button>
      </div>

      {/* Header */}
      <div className="header">
        <div>
          <div className="biz-name">{biz?.name ?? biz?.businessName ?? 'Your Business'}</div>
          <div className="biz-sub">
            {biz?.phone && <div>{biz.phone}</div>}
            {biz?.address && <div>{biz.address}</div>}
            {biz?.email && <div>{biz.email}</div>}
          </div>
        </div>
        <div className="invoice-title">
          <h1>INVOICE</h1>
          <p>#{sale.invoiceNo}</p>
          <p style={{ marginTop: '3px' }}>
            <span
              className={`status-badge ${
                sale.paymentStatus === 'paid' ? 'status-paid' :
                sale.paymentStatus === 'partial' ? 'status-partial' : 'status-unpaid'
              }`}
            >
              {sale.paymentStatus}
            </span>
          </p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="info-grid">
        <div className="info-box">
          <h4>Invoice Details</h4>
          <p><span className="label">Date:</span> {new Date(sale.saleDate).toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><span className="label">Invoice No:</span> {sale.invoiceNo}</p>
          {sale.warehouse && <p><span className="label">Warehouse:</span> {sale.warehouse.name}</p>}
          {sale.offerLabel && <p><span className="label">Offer:</span> {sale.offerLabel}</p>}
        </div>
        <div className="info-box">
          <h4>Bill To</h4>
          {sale.customer ? (
            <>
              <p style={{ fontWeight: 600 }}>{sale.customer.name}</p>
              {sale.customer.phone && <p>{sale.customer.phone}</p>}
              {sale.customer.address && <p>{sale.customer.address}</p>}
              {sale.customer.email && <p>{sale.customer.email}</p>}
            </>
          ) : (
            <p>Walk-in Customer</p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table>
        <thead>
          <tr>
            <th style={{ width: '30px' }}>#</th>
            <th>Product / Description</th>
            <th style={{ width: '60px' }}>Qty</th>
            <th style={{ width: '90px' }}>Unit Price</th>
            <th style={{ width: '80px' }}>Discount</th>
            <th style={{ width: '90px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any, i: number) => {
            const qty = Number(item.quantity ?? item.qty);
            const unitPrice = Number(item.unitPrice);
            const discount = Number(item.discountAmount ?? 0);
            const total = item.total ?? (qty * unitPrice - discount);
            return (
              <tr key={item.id ?? i}>
                <td style={{ color: '#888', fontSize: '11px' }}>{i + 1}</td>
                <td>
                  <div className="product-name">{item.product?.name ?? item.productName ?? '—'}</div>
                  {item.product?.sku && <div className="product-sku">SKU: {item.product.sku}</div>}
                </td>
                <td>{qty.toLocaleString()}</td>
                <td>৳{fmtN(unitPrice)}</td>
                <td style={{ color: '#38a169' }}>{discount > 0 ? `-৳${fmtN(discount)}` : '—'}</td>
                <td style={{ fontWeight: 600 }}>৳{fmtN(total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div className="totals">
        <table className="totals-table">
          <tbody>
            <tr>
              <td style={{ color: '#888' }}>Subtotal</td>
              <td>৳{fmtN(sale.subtotal ?? sale.subTotal ?? 0)}</td>
            </tr>
            {Number(sale.discountAmount) > 0 && (
              <tr>
                <td style={{ color: '#38a169' }}>Discount</td>
                <td style={{ color: '#38a169' }}>-৳{fmtN(sale.discountAmount)}</td>
              </tr>
            )}
            {Number(sale.taxAmount) > 0 && (
              <tr>
                <td style={{ color: '#3182ce' }}>VAT / Tax</td>
                <td style={{ color: '#3182ce' }}>+৳{fmtN(sale.taxAmount)}</td>
              </tr>
            )}
            {Number(sale.deliveryCharge) > 0 && (
              <tr>
                <td style={{ color: '#dd6b20' }}>Delivery</td>
                <td style={{ color: '#dd6b20' }}>+৳{fmtN(sale.deliveryCharge)}</td>
              </tr>
            )}
            <tr className="total-row">
              <td>Grand Total</td>
              <td>৳{fmtN(sale.grandTotal)}</td>
            </tr>
            <tr className="paid-row">
              <td>Amount Paid</td>
              <td>৳{fmtN(sale.paidAmount)}</td>
            </tr>
            {Number(sale.dueAmount) > 0 && (
              <tr className="due-row">
                <td>Balance Due</td>
                <td>৳{fmtN(sale.dueAmount)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payments */}
      {payments.length > 0 && (
        <div className="payments">
          <h4>Payment Details</h4>
          {payments.map((p: any, i: number) => (
            <div key={i} className="pay-entry">
              <span style={{ textTransform: 'capitalize' }}>{p.method?.replace('_', ' ') ?? 'Cash'}</span>
              <span style={{ color: '#38a169', fontWeight: 600 }}>৳{fmtN(p.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bank Details */}
      {showBankDetails && (
        <div className="bank-details">
          <h4>Bank Details</h4>
          <p>
            {settings.bankName && <span>Bank: {settings.bankName}  </span>}
            {settings.bankAccount && <span>Account: {settings.bankAccount}  </span>}
            {settings.bankBranch && <span>Branch: {settings.bankBranch}</span>}
          </p>
        </div>
      )}

      {/* Notes */}
      {(sale.note || terms) && (
        <div style={{ marginBottom: '5mm', fontSize: '11px', color: '#666' }}>
          {terms && <p><strong>Terms:</strong> {terms}</p>}
          {sale.note && <p style={{ marginTop: '2mm' }}><strong>Note:</strong> {sale.note}</p>}
        </div>
      )}

      {/* Footer */}
      <div className="footer">
        <div className="footer-msg">{invoiceFooter}</div>
        <div className="footer-terms">
          Generated on {new Date().toLocaleString('en-BD')} · {biz?.name ?? 'BizCore ERP'}
        </div>
      </div>
    </div>
  );
};

export default InvoiceA4;
