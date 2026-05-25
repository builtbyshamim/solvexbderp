import { configureStore } from "@reduxjs/toolkit";
import { reducer } from "./rootReducer.ts";
import { persistStore } from "redux-persist";
import {baseApi} from "./api/baseApi.ts";

const isClient = typeof window !== "undefined";
export const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ["persist/PERSIST"],
                ignoredActionPaths: ["register"],
                ignoredPaths: ["register"],
            },
        }).concat(baseApi.middleware),
});

export const persistor = isClient ? persistStore(store) : null;