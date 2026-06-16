import { useDispatch } from 'react-redux';
import { Warehouse, ChevronDown } from 'lucide-react';
import { setActiveWarehouse } from '../../redux/features/warehouseSlice';
import { useActiveWarehouse } from '../../hooks/useActiveWarehouse';

const WarehouseSelector = () => {
  const dispatch = useDispatch();
  const { warehouseId, warehouseName, warehouses, hasWarehouses, isLoading } =
    useActiveWarehouse();

  // No warehouses at all — render nothing (don't break anything)
  if (!hasWarehouses && !isLoading) return null;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="hidden sm:flex h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
    );
  }

  // Only one warehouse — show as a read-only badge, no selector needed
  if (warehouses.length === 1) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#DBDFE9] bg-gray-50 text-xs font-medium text-gray-600 select-none">
        <Warehouse className="h-3.5 w-3.5 text-[#ff6d29]" />
        <span className="max-w-[120px] truncate">{warehouseName}</span>
      </div>
    );
  }

  // Multiple warehouses — show a dropdown
  return (
    <div className="relative hidden sm:block">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#DBDFE9] bg-gray-50 text-xs font-medium text-gray-600">
        <Warehouse className="h-3.5 w-3.5 text-[#ff6d29] shrink-0" />
        <select
          value={warehouseId ?? ''}
          onChange={(e) => {
            const w = warehouses.find((wh) => wh.id === e.target.value);
            if (w) dispatch(setActiveWarehouse({ id: w.id, name: w.name }));
          }}
          className="bg-transparent border-0 outline-none text-xs font-medium text-gray-600 cursor-pointer max-w-[120px] truncate pr-4"
        >
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}{w.isDefault ? ' ★' : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="h-3 w-3 text-gray-400 pointer-events-none -ml-3" />
      </div>
    </div>
  );
};

export default WarehouseSelector;
