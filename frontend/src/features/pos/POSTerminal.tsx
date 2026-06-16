import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Printer,
  RotateCcw,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateSaleMutation } from '../sales/salesApi';
import { useGetAllCustomersQuery } from '../sales/salesApi';
import { useGetAllProductsQuery } from '../inventory/products/productApi';
import { useActiveWarehouse } from '../../hooks/useActiveWarehouse';
import { useNavigate } from 'react-router-dom';

interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  qty: number;
  total: number;
}

const LIMIT = 12;

// ── Product Search Dropdown (opens upward) ────────────────────────────────────
const ProductSearchDropdown = ({
  warehouseId,
  onSelect,
}: {
  warehouseId: string;
  onSelect: (p: any) => void;
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<any[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset accumulation when query changes
  useEffect(() => {
    setPage(1);
    setAccumulated([]);
  }, [query]);

  const { data, isFetching } = useGetAllProductsQuery(
    { search: query || undefined, limit: LIMIT, page },
    { skip: !open },
  );

  const incoming: any[] = data?.data ?? [];
  const meta = data?.meta;
  const hasMore = meta ? page < meta.totalPages : false;

  // Merge new page into accumulated list (deduplicate by id)
  useEffect(() => {
    if (incoming.length === 0) return;
    setAccumulated((prev) => {
      const ids = new Set(prev.map((p) => p.id));
      const fresh = incoming.filter((p) => !ids.has(p.id));
      return [...prev, ...fresh];
    });
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getStock = (p: any): number => {
    const stocks: any[] = p.stocks ?? [];
    if (!stocks.length) return 0;
    if (warehouseId) {
      const exact = stocks.find((s) => s.warehouseId === warehouseId);
      if (exact) return Number(exact.currentQty ?? 0);
      const def = stocks.find((s) => s.warehouseId === null);
      if (def) return Number(def.currentQty ?? 0);
    }
    const def = stocks.find((s) => s.warehouseId === null);
    if (def) return Number(def.currentQty ?? 0);
    return stocks.reduce((sum, s) => sum + Number(s.currentQty ?? 0), 0);
  };

  const handleSelect = (p: any) => {
    onSelect(p);
    setQuery('');
    setOpen(false);
    setPage(1);
    setAccumulated([]);
    inputRef.current?.focus();
  };

  const loadMore = () => {
    if (!isFetching && hasMore) setPage((p) => p + 1);
  };

  return (
    <div className="relative flex-1" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search product or scan barcode..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="pl-9 pr-4 py-2.5 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
          autoFocus
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-[#ff6d29]" />
        )}
      </div>

      {/* Dropdown — opens ABOVE the input */}
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-[#DBDFE9] rounded-lg shadow-xl z-50 max-h-72 flex flex-col">
          <div className="overflow-y-auto flex-1">
            {accumulated.length === 0 && !isFetching && (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">
                {query ? 'No products found' : 'Type to search products'}
              </div>
            )}
            {accumulated.map((p: any) => {
              const stock = getStock(p);
              const outOfStock = stock <= 0;
              return (
                <button
                  key={p.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(p);
                  }}
                  disabled={outOfStock}
                  className="w-full text-left px-3 py-2.5 hover:bg-orange-50 border-b border-gray-50 last:border-0 flex items-center justify-between gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#26272F] truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.sku || '—'}</p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-sm font-bold text-[#ff6d29]">
                      ৳{Number(p.sellingPrice).toLocaleString()}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        outOfStock
                          ? 'text-red-500'
                          : stock <= 5
                            ? 'text-yellow-600'
                            : 'text-green-600'
                      }`}
                    >
                      {outOfStock ? 'Out of stock' : `${Number(stock).toFixed(0)} in stock`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="border-t border-[#DBDFE9] p-2 shrink-0">
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  loadMore();
                }}
                disabled={isFetching}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-[#ff6d29] hover:bg-orange-50 rounded font-medium disabled:opacity-40"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" /> Load more (
                    {meta?.totalItems ? meta.totalItems - accumulated.length : '?'} remaining)
                  </>
                )}
              </button>
            </div>
          )}

          {/* Loading first page */}
          {isFetching && accumulated.length === 0 && (
            <div className="px-4 py-4 text-center">
              <Loader2 className="h-5 w-5 animate-spin text-[#ff6d29] mx-auto" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main POS Terminal ─────────────────────────────────────────────────────────

const POSTerminal = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [discountPct, setDiscountPct] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [category, setCategory] = useState('All');
  const [gridSearch, setGridSearch] = useState('');
  const [gridPage, setGridPage] = useState(1);
  const [gridProducts, setGridProducts] = useState<any[]>([]);

  const { data: gridData, isFetching: gridFetching } = useGetAllProductsQuery({
    search: gridSearch || undefined,
    limit: 24,
    page: gridPage,
  });

  const gridMeta = gridData?.meta;
  const gridHasMore = gridMeta ? gridPage < gridMeta.totalPages : false;

  // Accumulate grid pages
  useEffect(() => {
    const incoming: any[] = gridData?.data ?? [];
    if (incoming.length === 0) return;
    if (gridPage === 1) {
      setGridProducts(incoming);
    } else {
      setGridProducts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...incoming.filter((p) => !ids.has(p.id))];
      });
    }
  }, [gridData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset grid when search changes
  useEffect(() => {
    setGridPage(1);
    setGridProducts([]);
  }, [gridSearch]);

  const { data: customersData } = useGetAllCustomersQuery({ limit: 200 });
  const customers: any[] = customersData?.data ?? [];

  const { warehouseId: activeWarehouseId, warehouses } = useActiveWarehouse();
  const [createSale, { isLoading: isCheckingOut }] = useCreateSaleMutation();

  useEffect(() => {
    if (activeWarehouseId && !warehouseId) setWarehouseId(activeWarehouseId);
  }, [activeWarehouseId]);

  const getStock = (p: any): number => {
    const stocks: any[] = p.stocks ?? [];
    if (!stocks.length) return 0;
    if (warehouseId) {
      const exact = stocks.find((s) => s.warehouseId === warehouseId);
      if (exact) return Number(exact.currentQty ?? 0);
      const def = stocks.find((s) => s.warehouseId === null);
      if (def) return Number(def.currentQty ?? 0);
    } else {
      const def = stocks.find((s) => s.warehouseId === null);
      if (def) return Number(def.currentQty ?? 0);
    }
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
      const result = await createSale({
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
      const newId = result?.data?.id ?? result?.id;
      setCart([]);
      setPaidAmount('');
      setDiscountPct('0');
      setCustomerId('');

      if (newId) navigate(`/admin/sales/${newId}`);
    } catch (err: any) {
      toast.error(err?.message || 'Checkout failed');
    }
  };

  // Category list from grid products
  const allCategories = [
    'All',
    ...Array.from(new Set(gridProducts.map((p: any) => p.category?.name).filter(Boolean))),
  ] as string[];

  const filteredGrid = gridProducts.filter(
    (p: any) => category === 'All' || p.category?.name === category,
  );

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-4 overflow-hidden">
      {/* Products Panel */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white border border-[#DBDFE9] rounded-lg">
        <div className="p-3 border-b border-[#DBDFE9]">
          {/* Top row: search dropdown + warehouse picker */}
          <div className="flex gap-2 mb-3">
            <ProductSearchDropdown warehouseId={warehouseId} onSelect={addToCart} />
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

          {/* Grid filter search */}
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Filter grid..."
                value={gridSearch}
                onChange={(e) => setGridSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-[#DBDFE9] rounded-lg text-xs w-full focus:outline-none focus:border-[#ff6d29]"
              />
            </div>
          </div>

          {/* Category chips */}
          {allCategories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allCategories.map((cat) => (
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

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
            {filteredGrid.map((product: any) => {
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

            {filteredGrid.length === 0 && !gridFetching && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
                <Search className="h-10 w-10 mb-2 text-gray-300" />
                <p className="text-sm">No products found</p>
              </div>
            )}

            {gridFetching && gridProducts.length === 0 && (
              <div className="col-span-full flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-[#ff6d29]" />
              </div>
            )}
          </div>

          {/* Load more grid */}
          {gridHasMore && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setGridPage((p) => p + 1)}
                disabled={gridFetching}
                className="flex items-center gap-2 px-5 py-2 border border-[#DBDFE9] rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                {gridFetching ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" /> Load more
                  </>
                )}
              </button>
            </div>
          )}
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
              <p className="text-xs mt-1">Search or click a product to add</p>
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
            <button
              onClick={() => {
                if (cart.length === 0) {
                  toast.error('Cart is empty');
                  return;
                }
                // Quick POS receipt in new window using last sale id would need a sale first.
                toast('Complete checkout to print receipt', { icon: '🖨️' });
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
            >
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
