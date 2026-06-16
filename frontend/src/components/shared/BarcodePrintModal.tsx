import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { X, Printer, Minus, Plus } from 'lucide-react';

export interface BarcodePrintProduct {
  id: string;
  name: string;
  barcode: string;
  sku?: string;
  sellingPrice?: number;
}

interface Props {
  product: BarcodePrintProduct | null;
  onClose: () => void;
}

// Renders a single barcode SVG via JsBarcode
function BarcodeLabel({ barcode, name, price, sku }: { barcode: string; name: string; price?: number; sku?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !barcode) return;
    try {
      JsBarcode(svgRef.current, barcode, {
        format: barcode.length === 13 ? 'EAN13' : 'CODE128',
        width: 1.8,
        height: 50,
        displayValue: true,
        fontSize: 10,
        margin: 4,
        background: '#ffffff',
        lineColor: '#000000',
      });
    } catch {
      // fallback to CODE128 if EAN13 validation fails
      JsBarcode(svgRef.current, barcode, {
        format: 'CODE128',
        width: 1.8,
        height: 50,
        displayValue: true,
        fontSize: 10,
        margin: 4,
      });
    }
  }, [barcode]);

  return (
    <div
      className="barcode-label"
      style={{
        width: '220px',
        border: '1px solid #e5e7eb',
        borderRadius: '4px',
        padding: '6px 8px',
        background: '#fff',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'monospace',
        pageBreakInside: 'avoid',
        margin: '4px',
      }}
    >
      <svg ref={svgRef} style={{ maxWidth: '100%' }} />
      <div style={{ fontSize: '10px', fontWeight: 600, textAlign: 'center', lineHeight: 1.3, marginTop: '2px', wordBreak: 'break-word' }}>
        {name}
      </div>
      {sku && (
        <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '1px' }}>SKU: {sku}</div>
      )}
      {price !== undefined && price > 0 && (
        <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '2px', color: '#111' }}>
          ৳{Number(price).toFixed(2)}
        </div>
      )}
    </div>
  );
}

const BarcodePrintModal = ({ product, onClose }: Props) => {
  const [quantity, setQuantity] = useState(1);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!product) return null;

  const handlePrint = () => {
    const printContents = printAreaRef.current?.innerHTML;
    if (!printContents) return;

    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode Labels — ${product.name}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { background: #fff; padding: 8px; }
            .print-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
              padding: 4px;
            }
            .barcode-label {
              width: 220px;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              padding: 6px 8px;
              background: #fff;
              display: inline-flex;
              flex-direction: column;
              align-items: center;
              font-family: monospace;
              page-break-inside: avoid;
            }
            svg { max-width: 100%; }
            @media print {
              body { padding: 0; }
              @page { margin: 8mm; }
            }
          </style>
        </head>
        <body>
          <div class="print-grid">${printContents}</div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); window.close(); }, 300);
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const labels = Array.from({ length: Math.min(quantity, 100) });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DBDFE9]">
          <div>
            <h3 className="font-semibold text-gray-800">Print Barcode Labels</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Single label preview */}
          <div className="flex justify-center mb-5">
            <BarcodeLabel
              barcode={product.barcode}
              name={product.name}
              price={product.sellingPrice}
              sku={product.sku}
            />
          </div>

          {/* Quantity selector */}
          <div className="flex items-center justify-center gap-4 mb-5">
            <span className="text-sm font-medium text-gray-600">Copies:</span>
            <div className="flex items-center border border-[#DBDFE9] rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 1 && v <= 100) setQuantity(v);
                }}
                className="w-16 text-center text-sm font-semibold border-0 focus:outline-none py-2"
              />
              <button
                onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xs text-gray-400">max 100</span>
          </div>

          {/* Hidden print area that contains all labels */}
          <div ref={printAreaRef} style={{ display: 'none' }}>
            {labels.map((_, i) => (
              <_InlineBarcodeLabel
                key={i}
                barcode={product.barcode}
                name={product.name}
                price={product.sellingPrice}
                sku={product.sku}
              />
            ))}
          </div>

          {/* Label info */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Barcode</span>
              <span className="font-mono font-medium text-gray-700">{product.barcode}</span>
            </div>
            {product.sku && (
              <div className="flex justify-between">
                <span>SKU</span>
                <span className="font-medium text-gray-700">{product.sku}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Format</span>
              <span className="text-gray-700">
                {product.barcode.length === 13 ? 'EAN-13' : 'Code 128'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total labels</span>
              <span className="font-semibold text-gray-800">{quantity}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#DBDFE9] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] flex items-center justify-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print {quantity} Label{quantity > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

// A pure HTML-string label used inside the print window (no React rendering)
function _InlineBarcodeLabel({ barcode, name, price, sku }: { barcode: string; name: string; price?: number; sku?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    try {
      JsBarcode(svgRef.current, barcode, {
        format: barcode.length === 13 ? 'EAN13' : 'CODE128',
        width: 1.8,
        height: 50,
        displayValue: true,
        fontSize: 10,
        margin: 4,
      });
    } catch {
      JsBarcode(svgRef.current, barcode, {
        format: 'CODE128',
        width: 1.8,
        height: 50,
        displayValue: true,
        fontSize: 10,
        margin: 4,
      });
    }
  }, [barcode]);

  return (
    <div className="barcode-label" style={{ fontFamily: 'monospace' }}>
      <svg ref={svgRef} style={{ maxWidth: '100%' }} />
      <div style={{ fontSize: '10px', fontWeight: 600, textAlign: 'center', lineHeight: 1.3, marginTop: '2px', wordBreak: 'break-word' }}>
        {name}
      </div>
      {sku && <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '1px' }}>SKU: {sku}</div>}
      {price !== undefined && price > 0 && (
        <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>৳{Number(price).toFixed(2)}</div>
      )}
    </div>
  );
}

export default BarcodePrintModal;
