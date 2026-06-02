import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface WarehouseState {
  selectedId: string | null;
  selectedName: string | null;
}

const initialState: WarehouseState = {
  selectedId: null,
  selectedName: null,
};

const warehouseSlice = createSlice({
  name: 'warehouse',
  initialState,
  reducers: {
    setActiveWarehouse(
      state,
      action: PayloadAction<{ id: string; name: string } | null>,
    ) {
      state.selectedId = action.payload?.id ?? null;
      state.selectedName = action.payload?.name ?? null;
    },
    clearActiveWarehouse(state) {
      state.selectedId = null;
      state.selectedName = null;
    },
  },
});

export const { setActiveWarehouse, clearActiveWarehouse } = warehouseSlice.actions;
export default warehouseSlice.reducer;
