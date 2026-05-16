import {
  getLegacyProductCategoryLabel,
  parseProductCategory,
  ProductCategory,
  ProductCategoryOption,
  resolveCategoryOption,
} from "./category";
import type { Genre } from "./genre";
import { ProductAvailability, ProductState, ProductStatus } from "./status";
import type { Size, VariantProduct } from "./variants";

export interface ProductImage {
  url: string;
  publicId: string;
}

export interface ProductStats {
  views: number;
  favorites: number;
  cartAdds: number;
  purchases: number;
  searches: number;
}

export interface Product {
  id: string;
  sku?: string;
  slug?: string;
  categoryId?: string;
  name: string;
  description?: string;
  brand?: string;
  thumbnail?: string;
  genre?: Genre;
  variants?: VariantProduct[];
  images?: ProductImage[];
  stock?: number;
  price?: number;
  state?: ProductState;
  availability?: ProductAvailability;
  stats?: ProductStats;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  category?: ProductCategory;
  status?: ProductStatus;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export enum ProductSortBy {
  NEWEST = "newest",
  OLDEST = "oldest",
  PRICE_ASC = "price_asc",
  PRICE_DESC = "price_desc",
  NAME_ASC = "name_asc",
  NAME_DESC = "name_desc",
  MOST_PURCHASED = "most_purchased",
  MOST_VIEWED = "most_viewed",
  MOST_FAVORITED = "most_favorited",
  MOST_CART_ADDED = "most_cart_added",
  MOST_SEARCHED = "most_searched",
}

export interface ProductFiltersModel {
  name?: string;
  categoryId?: string;
  genre?: Genre;
  variantNames?: string[];
  minPrice?: number;
  maxPrice?: number;
  state?: ProductState;
  availability?: ProductAvailability;
  includeDeleted?: boolean;
  category?: string;
  sizes?: Size[];
}

export interface PaginationModel {
  page: number;
  limit: number;
  sortBy?: ProductSortBy;
}

export interface ProductsQueryModel {
  filters: ProductFiltersModel;
  pagination: PaginationModel;
}

export interface ProductSearchFilters {
  page?: number;
  limit?: number;
  sortBy?: ProductSortBy;
  name?: string;
  categoryId?: string;
  genre?: Genre;
  variantNames?: string[];
  minPrice?: number;
  maxPrice?: number;
  state?: ProductState;
  availability?: ProductAvailability;
  includeDeleted?: boolean;
  category?: string;
  sizes?: Size[];
}

export interface CreateProduct {
  categoryId: string;
  name: string;
  description?: string;
  brand?: string;
  thumbnail?: string;
  images?: ProductImage[];
  genre?: Genre;
  variants?: VariantProduct[];
  stock?: number;
  price?: number;
  category?: string;
}

export interface UploadProduct {
  id: string;
  categoryId?: string;
  name?: string;
  genre?: Genre;
  description?: string;
  brand?: string;
  thumbnail?: string;
  variants?: VariantProduct[];
  images?: ProductImage[];
  stock?: number;
  price?: number;
  state?: ProductState;
  availability?: ProductAvailability;
  category?: string;
  status?: ProductStatus;
}

export const getProductCategoryLabel = (
  product?: (Pick<Product, "categoryId"> & { category?: string | null }) | null,
  options?: ProductCategoryOption[],
): string => {
  if (!product) return "";
  const resolvedCategory =
    resolveCategoryOption(product.categoryId, options) ||
    resolveCategoryOption(product.category, options);

  return (
    resolvedCategory?.label ||
    (parseProductCategory(product.category)
      ? getLegacyProductCategoryLabel(
          parseProductCategory(product.category) as ProductCategory,
        )
      : "") ||
    product.category ||
    product.categoryId ||
    ""
  );
};
