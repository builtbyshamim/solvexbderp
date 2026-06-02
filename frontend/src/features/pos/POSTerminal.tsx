import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Printer,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateSaleMutation } from '../sales/salesApi';
import { useGetAllCustomersQuery } from '../sales/salesApi';
import { useGetAllProductsQuery } from '../inventory/products/productApi';
import { useActiveWarehouse } from '../../hooks/useActiveWarehouse';

interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  qty: number;
  total: number;
}

const POSTerminal = () => {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [discountPct, setDiscountPct] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [category, setCategory] = useState('All');

  const { data: productsData } = useGetAllProductsQuery({ search, limit: 50 });
  const products: any[] = productsData?.data ?? [];
  console.log(productsData, 'productsData');

  const { data: customersData } = useGetAllCustomersQuery({ limit: 200 });
  const customers: any[] = customersData?.data ?? [];

  const { warehouseId: activeWarehouseId, warehouses } = useActiveWarehouse();
  const [createSale, { isLoading: isCheckingOut }] = useCreateSaleMutation();

  // Keep local warehouseId in sync with global selection (can override per-session)
  useEffect(() => {
    if (activeWarehouseId && !warehouseId) setWarehouseId(activeWarehouseId);
  }, [activeWarehouseId]);

  const getStock = (p: any): number => {
    const stocks: any[] = p.stocks ?? [];
    if (!stocks.length) return 0;

    if (warehouseId) {
      // 1. Exact match — stock for the selected warehouse's location
      const exact = stocks.find((s) => s.warehouseId === warehouseId);
      if (exact) return Number(exact.currentQty ?? 0);

      // 2. Business-default location (warehouseId === null) as fallback
      const def = stocks.find((s) => s.warehouseId === null);
      if (def) return Number(def.currentQty ?? 0);
    } else {
      // No warehouse selected — use business default first
      const def = stocks.find((s) => s.warehouseId === null);
      if (def) return Number(def.currentQty ?? 0);
    }

    // 3. Last resort — sum all locations
    return stocks.reduce((sum, s) => sum + Number(s.currentQty ?? 0), 0);
  };

  const addToCart = (product: any) => {
    const stock = getStock(product);
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        if (existing.qty >= stock) {
          toast.error('Insufficient stock');
          return prev;
        }
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.price } : i,
        );
      }
      if (stock <= 0) {
        toast.error('Out of stock');
        return prev;
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.sellingPrice),
          stock,
          qty: 1,
          total: Number(product.sellingPrice),
        },
      ];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty, total: qty * i.price } : i)));
  };

  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const discountAmt = Math.round((subtotal * Number(discountPct)) / 100);
  const grandTotal = Math.max(0, subtotal - discountAmt);
  const paid = Number(paidAmount) || 0;
  const change = paid > grandTotal ? paid - grandTotal : 0;
  const due = paid < grandTotal ? grandTotal - paid : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (!warehouseId) {
      toast.error('No warehouse available');
      return;
    }

    try {
      await createSale({
        customerId: customerId || undefined,
        warehouseId,
        saleDate: new Date().toISOString().split('T')[0],
        items: cart.map((i) => ({
          productId: i.id,
          quantity: i.qty,
          unitPrice: i.price,
          discountAmount: 0,
        })),
        discountAmount: discountAmt,
        paidAmount: paid || grandTotal,
        paymentMethod,
      }).unwrap();

      toast.success('Sale completed!');
      setCart([]);
      setPaidAmount('');
      setDiscountPct('0');
      setCustomerId('');
    } catch (err: any) {
      toast.error(err?.message || 'Checkout failed');
    }
  };

  // Get unique category names from products
  const categories = [
    'All',
    ...Array.from(new Set(products.map((p: any) => p.category?.name).filter(Boolean))),
  ] as string[];

  const filteredProducts = products.filter((p: any) => {
    const matchCat = category === 'All' || p.category?.name === category;
    return matchCat;
  });

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-4 overflow-hidden">
      {/* Products Panel */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white border border-[#DBDFE9] rounded-lg">
        <div className="p-3 border-b border-[#DBDFE9]">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search product or scan barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2.5 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                autoFocus
              />
            </div>
            {warehouses.length > 1 && (
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="px-2 py-2 border border-[#DBDFE9] rounded-lg text-xs focus:outline-none focus:border-[#ff6d29] shrink-0"
              >
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === cat ? 'bg-[#ff6d29] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
            {filteredProducts.map((product: any) => {
              const stock = getStock(product);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={stock <= 0}
                  className="bg-white border border-[#DBDFE9] rounded-lg p-3 text-left hover:border-[#ff6d29] hover:shadow-sm transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="h-10 w-10 rounded-lg bg-[#fff3eb] flex items-center justify-center mb-2 group-hover:bg-[#ff6d29] transition-colors">
                    <ShoppingCart className="h-5 w-5 text-[#ff6d29] group-hover:text-white" />
                  </div>
                  <p className="font-medium text-xs text-[#26272F] leading-tight line-clamp-2">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{product.sku}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-sm text-[#ff6d29]">
                      ৳{Number(product.sellingPrice).toLocaleString()}
                    </span>
                    <span className={`text-xs ${stock <= 5 ? 'text-red-500' : 'text-gray-400'}`}>
                      {stock <= 0 ? 'Out' : `Stk: ${stock}`}
                    </span>
                  </div>
                </button>
              );
            })}
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
              <button
                onClick={() => setCart([])}
                className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
          >
            <option value="">Walk-in Customer</option>
            {customers.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
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
                    <button
                      onClick={() => setCart((prev) => prev.filter((i) => i.id !== item.id))}
                      className="text-red-400 hover:text-red-600 flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="h-7 w-7 rounded-lg border border-[#DBDFE9] flex items-center justify-center hover:bg-gray-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        disabled={item.qty >= item.stock}
                        className="h-7 w-7 rounded-lg border border-[#DBDFE9] flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="font-bold text-sm text-[#26272F]">
                      ৳{item.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Payment */}
        <div className="p-4 border-t border-[#DBDFE9] space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>৳{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Discount %</span>
              <input
                type="number"
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
                min="0"
                max="100"
                className="w-16 px-2 py-1 border border-[#DBDFE9] rounded text-xs text-center focus:outline-none focus:border-[#ff6d29]"
              />
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount</span>
                <span>-৳{discountAmt.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[#26272F] text-base border-t border-[#DBDFE9] pt-2">
              <span>Total</span>
              <span>৳{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {['cash', 'card', 'mobile'].map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`py-1.5 rounded text-xs font-medium capitalize transition-colors ${paymentMethod === m ? 'bg-[#ff6d29] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {m}
              </button>
            ))}
          </div>

          <input
            type="number"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            placeholder={`Paid ৳${grandTotal.toLocaleString()}`}
            className="w-full px-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] text-center font-semibold text-lg"
          />

          {change > 0 && (
            <p className="text-green-600 text-sm font-medium text-center">
              Change: ৳{change.toLocaleString()}
            </p>
          )}
          {due > 0 && (
            <p className="text-red-500 text-sm font-medium text-center">
              Due: ৳{due.toLocaleString()}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-1.5 py-2.5 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut || cart.length === 0}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-semibold hover:bg-[#e65a1f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isCheckingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `Charge ৳${grandTotal.toLocaleString()}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSTerminal;
