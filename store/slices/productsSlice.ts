import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Product } from "@/types/domain/products";

interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  products: [],
  loading: false,
  error: null,
};

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setProducts(state, action: PayloadAction<Product[]>) {
      state.products = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
    addProduct(state, action: PayloadAction<Product>) {
      state.products.push(action.payload);
    },
    removeProduct(state, action: PayloadAction<string>) {
      state.products = state.products.filter((p) => p.id !== action.payload);
    },
    updateProduct(state, action: PayloadAction<Product>) {
      const idx = state.products.findIndex((p) => p.id === action.payload.id);
      if (idx !== -1) {
        state.products[idx] = action.payload;
      }
    },
  },
});

export const {
  setProducts,
  setLoading,
  setError,
  addProduct,
  removeProduct,
  updateProduct,
} = productsSlice.actions;

export default productsSlice.reducer;
