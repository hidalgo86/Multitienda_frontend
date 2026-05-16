import { configureStore } from "@reduxjs/toolkit";
// Importa tus slices aquí cuando los crees
// import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";
import favoriteReducer from "./slices/favoriteSlice";
// import ordersReducer from "./slices/ordersSlice";
import productsReducer from "./slices/productsSlice";

export const store = configureStore({
  reducer: {
    // auth: authReducer,
    cart: cartReducer,
    favorites: favoriteReducer,
    // orders: ordersReducer,
    products: productsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
// store/index.ts
