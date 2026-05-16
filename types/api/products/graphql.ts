import type { ProductImage } from "@/types/domain/products";

export interface GraphqlError {
  message?: string;
}

export interface CreateProductGraphqlVariantInput {
  name: string;
  stock: number;
  price: number;
  image?: string;
}

export interface CreateProductGraphqlInput {
  categoryId: string;
  name: string;
  description?: string;
  brand?: string;
  thumbnail?: string;
  images?: ProductImage[];
  genre?: "NINA" | "NINO" | "UNISEX";
  variants?: CreateProductGraphqlVariantInput[];
  stock?: number;
  price?: number;
}

export interface CreateProductMutationResponse {
  data?: {
    createProduct?: unknown;
  };
  errors?: GraphqlError[];
}

export interface UpdateProductGraphqlInput {
  categoryId?: string;
  name?: string;
  description?: string;
  brand?: string;
  thumbnail?: string;
  images?: ProductImage[];
  genre?: "NINA" | "NINO" | "UNISEX" | null;
  variants?: CreateProductGraphqlVariantInput[];
  stock?: number;
  price?: number;
  state?: "ACTIVO" | "ELIMINADO";
}

export interface UpdateProductMutationResponse {
  data?: {
    updateProduct?: unknown;
  };
  errors?: GraphqlError[];
}

export interface ProductByIdQueryResponse {
  data?: {
    product?: unknown;
  };
  errors?: GraphqlError[];
}
