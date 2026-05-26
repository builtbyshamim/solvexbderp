import { useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Printer, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
}

interface CartItem extends Product {
  qty: number;
  total: number;
}

const products: Product[] = [
  { id: 1, name: 'Laptop Stand', sku: 'SKU-001', price: 1200, stock: 45, category: 'Accessories' },
  { id: 2, name: 'USB-C Cable', sku: 'SKU-002', price: 250, stock: 120, category: 'Cables' },
  { id: 3, name: 'Wireless Mouse', sku: 'SKU-003', price: 1500, stock: 32, category: 'Peripherals' },
  { id: 4, name: 'Mechanical Keyboard', sku: 'SKU-004', price: 3200, stock: 18, category: 'Peripherals' },
  { id: 5, name: 'Monitor Stand', sku: 'SKU-005', price: 850, stock: 25, category: 'Accessories' },
  { id: 6, name: 'HDMI Cable', sku: 'SKU-006', price: 350, stock: 80, category: 'Cables' },
  { id: 7, name: 'Webcam HD', sku: 'SKU-007', price: 2800, stock: 12, category: 'Peripherals' },
  { id: 8, name: 'USB Hub 4-Port', sku: 'SKU-008', price: 750, stock: 55, category: 'Accessories' },
];

const POSTerminal = () => {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState('');
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [category, setCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'All' || p.category === category;
    return matchSearch && matchCategory;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) { toast.error('Insufficient stock'); return prev; }
        return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.price } : i);
      }
      return [...prev, { ...product, qty: 1, total: product.price }];
    });
  };

  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) { setCart((prev) => prev.filter((i) => i.id !== id)); return; }
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty, total: qty * i.price } : i));
  };

  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const discountAmt = (subtotal * Number(discount)) / 100;
  const grandTotal = subtotal - discountAmt;
  const change = Number(paidAmount) > grandTotal ? Number(paidAmount) - grandTotal : 0;
  const due = Number(paidAmount) < grandTotal ? grandTotal - Number(paidAmount) : 0;

  const handleCheckout = () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    toast.success('Sale completed!');
    setCart([]);
    setPaidAmount('');
    setDiscount('0');
    setCustomer('');
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-4 overflow-hidden">
      {/* Products Panel */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white border border-[#DBDFE9] rounded-lg">
        <div className="p-3 border-b border-[#DBDFE9]">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search product or scan barcode..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2.5 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" autoFocus />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === cat ? 'bg-[#ff6d29] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
            {filteredProducts.map((product) => (
              <button key={product.id} onClick={() => addToCart(product)}
                className="bg-white border border-[#DBDFE9] rounded-lg p-3 text-left hover:border-[#ff6d29] hover:shadow-sm transition-all group">
                <div className="h-10 w-10 rounded-lg bg-[#fff3eb] flex items-center justify-center mb-2 group-hover:bg-[#ff6d29] transition-colors">
                  <ShoppingCart className="h-5 w-5 text-[#ff6d29] group-hover:text-white" />
                </div>
                <p className="font-medium text-xs text-[#26272F] leading-tight line-clamp-2">{product.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{product.sku}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-sm text-[#ff6d29]">৳{product.price.toLocaleString()}</span>
                  <span className={`text-xs ${product.stock <= 10 ? 'text-red-500' : 'text-gray-400'}`}>Stk: {product.stock}</span>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
                <Search className="h-10 w-10 mb-2 text-gray-300" />
                <p className="text-sm">No products found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart / Checkout Panel */}
      <div className="w-full lg:w-96 flex flex-col bg-white border border-[#DBDFE9] rounded-lg">
        <div className="p-4 border-b border-[#DBDFE9]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[#26272F] flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-[#ff6d29]" />
              Cart ({cart.length})
            </h2>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                <RotateCcw className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          <select value={customer} onChange={(e) => setCustomer(e.target.value)}
            className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
            <option value="">Walk-in Customer</option>
            <option>Abdullah Al Mamun</option>
            <option>Fatema Begum</option>
            <option>Karim Enterprise</option>
          </select>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
              <ShoppingCart className="h-12 w-12 mb-3 text-gray-200" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Click products to add them</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {cart.map((item) => (
                <div key={item.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#26272F] truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">৳{item.price.toLocaleString()} each</p>
                    </div>
                    <button onClick={() => setCart((prev) => prev.filter((i) => i.id !== item.id))} className="text-red-400 hover:text-red-600 flex-shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.id, item.qty - 1)} className="h-7 w-7 rounded-lg border border-[#DBDFE9] flex items-center justify-center hover:bg-gray-50">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} className="h-7 w-7 rounded-lg border border-[#DBDFE9] flex items-center justify-center hover:bg-gray-50">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="font-bold text-sm text-[#26272F]">৳{item.total.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Payment */}
        <div className="p-4 border-t border-[#DBDFE9] space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Discount %</span>
              <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} min="0" max="100"
                className="w-16 px-2 py-1 border border-[#DBDFE9] rounded text-xs text-center focus:outline-none focus:border-[#ff6d29]" />
            </div>
            {discountAmt > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>-৳{discountAmt.toLocaleString()}</span></div>}
            <div className="flex justify-between font-bold text-[#26272F] text-base border-t border-[#DBDFE9] pt-2">
              <span>Total</span><span>৳{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {['cash', 'card', 'mobile'].map((m) => (
              <button key={m} onClick={() => setPaymentMethod(m)}
                className={`py-1.5 rounded text-xs font-medium capitalize transition-colors ${paymentMethod === m ? 'bg-[#ff6d29] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {m}
              </button>
            ))}
          </div>

          <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder={`Paid ৳${grandTotal.toLocaleString()}`}
            className="w-full px-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] text-center font-semibold text-lg" />

          {change > 0 && <p className="text-green-600 text-sm font-medium text-center">Change: ৳{change.toLocaleString()}</p>}
          {due > 0 && <p className="text-red-500 text-sm font-medium text-center">Due: ৳{due.toLocaleString()}</p>}

          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-1.5 py-2.5 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button onClick={handleCheckout} className="flex items-center justify-center gap-1.5 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-semibold hover:bg-[#e65a1f] transition-colors">
              Charge ৳{grandTotal.toLocaleString()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSTerminal;
