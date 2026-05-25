import { persistReducer } from "redux-persist";
import { baseApi } from "./api/baseApi.ts";
import storage from "redux-persist/lib/storage";
import toggleSlice from "./features/toggleSlice.ts";
import cartSlice from "./features/cartSlice.ts";
import authSlice from "./features/authSlice.ts";

const makePersistConfig = (key: any) => ({
  key,
  storage,
});

const persistedToggleSlice = persistReducer(
  makePersistConfig("toggle"),
  toggleSlice
);
const persistedCartSlice = persistReducer(
  makePersistConfig("carts"),
  cartSlice
);
const persistedAuthSlice = persistReducer(makePersistConfig("auth"), authSlice);

export const reducer = {
  [baseApi.reducerPath]: baseApi.reducer,
  toggle: persistedToggleSlice,
  carts: persistedCartSlice,
  auth: persistedAuthSlice,
};