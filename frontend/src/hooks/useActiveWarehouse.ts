import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetAllWarehouseQuery } from '../features/inventory/warehouse/warehouseApi';
import { setActiveWarehouse } from '../redux/features/warehouseSlice';

interface Warehouse {
  id: string;
  name: string;
  isDefault?: boolean;
  [key: string]: any;
}

interface RootState {
  warehouse: { selectedId: string | null; selectedName: string | null };
}

export function useActiveWarehouse() {
  const dispatch = useDispatch();
  const { selectedId, selectedName } = useSelector((s: RootState) => s.warehouse);

  const { data: raw, isLoading } = useGetAllWarehouseQuery({});

  // After axiosBaseQuery unwrap: data is { data: [...], meta: {} } for paginated,
  // or [...] for plain array — handle both shapes
  const warehouses: Warehouse[] = Array.isArray(raw) ? raw : ((raw as any)?.data ?? []);

  const hasWarehouses = warehouses.length > 0;

  // Validate: if stored selectedId no longer exists in the list, clear it
  useEffect(() => {
    if (!selectedId || !hasWarehouses) return;
    const stillExists = warehouses.some((w) => w.id === selectedId);
    if (!stillExists) {
      dispatch(setActiveWarehouse(null));
    }
  }, [warehouses.length, selectedId]);

  // The currently active warehouse object (null = no warehouse selected = use business default)
  const activeWarehouse = warehouses.find((w) => w.id === selectedId) ?? null;

  return {
    warehouseId: activeWarehouse?.id ?? null,
    warehouseName: activeWarehouse?.name ?? selectedName ?? null,
    warehouses,
    hasWarehouses,
    isLoading,
    activeWarehouse,
  };
}
