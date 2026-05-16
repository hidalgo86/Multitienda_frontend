import {
  buildApiUrl,
  buildAuthHeaders,
  fetchWithAuthRetry,
  parseResponseOrThrow,
  type ApiRequestOptions,
} from "@/lib/apiClient";
import type { Category } from "@/types/domain/products";
import {
  deleteCloudinaryImage,
  uploadCloudinaryImage,
} from "@/services/cloudinary-images";

type ApiOptions = ApiRequestOptions;

export interface CategoryInput {
  name: string;
  slug: string;
  parentId?: string;
  description?: string;
  imageUrl?: string;
  imagePublicId?: string | null;
  isFeatured?: boolean;
  displayOrder?: number;
}

export const listCategories = async (
  options: ApiOptions = {},
): Promise<Category[]> => {
  const response = await fetch(
    buildApiUrl("/api/categories/get", options.baseUrl),
    {
      cache: options.cache ?? "no-store",
      signal: options.signal,
    },
  );

  const data = await parseResponseOrThrow<unknown>(
    response,
    "Error al cargar categorias",
  );

  return Array.isArray(data) ? (data as Category[]) : [];
};

export const createCategory = async (
  input: CategoryInput,
  options: ApiOptions = {},
): Promise<Category> =>
  fetchWithAuthRetry(async (token) => {
    const response = await fetch(buildApiUrl("/api/categories", options.baseUrl), {
      method: "POST",
      headers: buildAuthHeaders(options.token ?? token, true),
      body: JSON.stringify(input),
      signal: options.signal,
    });

    return parseResponseOrThrow<Category>(response, "Error al crear categoria");
  }, "Error al crear categoria", options);

export const updateCategory = async (
  id: string,
  input: Partial<CategoryInput>,
  options: ApiOptions = {},
): Promise<Category> =>
  fetchWithAuthRetry(async (token) => {
    const response = await fetch(
      buildApiUrl(`/api/categories/${id}`, options.baseUrl),
      {
        method: "PATCH",
        headers: buildAuthHeaders(options.token ?? token, true),
        body: JSON.stringify(input),
        signal: options.signal,
      },
    );

    return parseResponseOrThrow<Category>(
      response,
      "Error al actualizar categoria",
    );
  }, "Error al actualizar categoria", options);

export const deleteCategory = async (
  id: string,
  options: ApiOptions = {},
): Promise<Category> =>
  fetchWithAuthRetry(async (token) => {
    const response = await fetch(
      buildApiUrl(`/api/categories/${id}`, options.baseUrl),
      {
        method: "DELETE",
        headers: buildAuthHeaders(options.token ?? token),
        signal: options.signal,
      },
    );

    return parseResponseOrThrow<Category>(
      response,
      "Error al eliminar categoria",
    );
  }, "Error al eliminar categoria", options);

export const uploadCategoryImage = async (
  file: File,
  options: ApiOptions = {},
): Promise<{ url: string; publicId: string }> =>
  uploadCloudinaryImage(file, "categories", options);

export const deleteCategoryImage = async (
  publicId: string,
  options: ApiOptions = {},
): Promise<void> => deleteCloudinaryImage(publicId, options);
