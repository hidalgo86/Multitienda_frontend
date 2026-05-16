import type {
  CreateProduct,
  PaginatedProducts,
  Product,
  ProductImage,
  ProductSearchFilters,
  UploadProduct,
} from "@/types/domain/products";
import {
  buildApiUrl,
  buildAuthHeaders,
  fetchWithAuthRetry,
  parseResponseOrThrow,
  type ApiRequestOptions,
} from "@/lib/apiClient";
import {
  deleteCloudinaryImage,
  uploadCloudinaryImage,
} from "@/services/cloudinary-images";

interface ProductApiOptions extends ApiRequestOptions {
  trackView?: boolean;
}

export const listProducts = async (
  params: ProductSearchFilters = {},
  options: ProductApiOptions = {},
): Promise<PaginatedProducts> => {
  const query = new URLSearchParams();

  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 20));

  if (params.name?.trim()) query.set("name", params.name.trim());
  if (params.category) query.set("category", params.category);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.genre) query.set("genre", String(params.genre));
  if (params.state) query.set("state", params.state);
  if (params.availability) query.set("availability", params.availability);
  if (params.includeDeleted) query.set("includeDeleted", "true");
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (typeof params.minPrice === "number") {
    query.set("minPrice", String(params.minPrice));
  }
  if (typeof params.maxPrice === "number") {
    query.set("maxPrice", String(params.maxPrice));
  }

  for (const size of params.sizes || []) {
    query.append("size", size);
  }

  for (const variantName of params.variantNames || []) {
    query.append("variantName", variantName);
  }

  const response = await fetch(
    buildApiUrl(`/api/products/get?${query.toString()}`, options.baseUrl),
    {
      cache: options.cache ?? "no-store",
      signal: options.signal,
    },
  );

  return parseResponseOrThrow<PaginatedProducts>(
    response,
    "Error al cargar productos",
  );
};

export const getProductById = async (
  id: string,
  options: ProductApiOptions = {},
): Promise<Product> => {
  const response = await fetch(
    buildApiUrl(
      `/api/products/get/${id}${
        options.trackView === false ? "?trackView=false" : ""
      }`,
      options.baseUrl,
    ),
    {
      cache: options.cache ?? "no-store",
      headers: buildAuthHeaders(options.token),
      signal: options.signal,
    },
  );

  return parseResponseOrThrow<Product>(response, "Error al cargar producto");
};

export const createProduct = async (
  input: CreateProduct,
  options: ProductApiOptions = {},
): Promise<Product> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch(
      buildApiUrl("/api/products/create", options.baseUrl),
      {
        method: "POST",
        headers: buildAuthHeaders(options.token ?? token, true),
        body: JSON.stringify(input),
        signal: options.signal,
      },
    );

    return parseResponseOrThrow<Product>(response, "Error al crear producto");
  }, "Error al crear producto", options);
};

export const uploadProductImage = async (
  file: File,
  options: ProductApiOptions = {},
): Promise<ProductImage> => uploadCloudinaryImage(file, "products", options);

export const deleteProductImage = async (
  publicId: string,
  options: ProductApiOptions = {},
): Promise<void> => deleteCloudinaryImage(publicId, options);

export const updateProduct = async (
  id: string,
  input: Partial<UploadProduct>,
  options: ProductApiOptions = {},
): Promise<Product> => {
  const payload: UploadProduct = {
    ...(input as UploadProduct),
    id,
  };

  return fetchWithAuthRetry(async (token) => {
    const response = await fetch(
      buildApiUrl(`/api/products/update/${id}`, options.baseUrl),
      {
        method: "PATCH",
        headers: buildAuthHeaders(options.token ?? token, true),
        body: JSON.stringify(payload),
        signal: options.signal,
      },
    );

    return parseResponseOrThrow<Product>(
      response,
      "Error al actualizar producto",
    );
  }, "Error al actualizar producto", options);
};
