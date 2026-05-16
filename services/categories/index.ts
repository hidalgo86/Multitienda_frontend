import type { Category } from "@/types/domain/products";
import {
  COOKIE_SESSION_MARKER,
  getStoredAuthToken,
  refreshSession,
} from "@/services/users";
import {
  deleteCloudinaryImage,
  uploadCloudinaryImage,
} from "@/services/cloudinary-images";

interface ApiOptions {
  baseUrl?: string;
  cache?: RequestCache;
  signal?: AbortSignal;
  token?: string | null;
}

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

const buildApiUrl = (path: string, baseUrl?: string): string => {
  if (!baseUrl) return path;
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
};

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

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : "Error al cargar categorías",
    );
  }

  return Array.isArray(data) ? (data as Category[]) : [];
};

const buildHeaders = (options: ApiOptions, includeJson = false): HeadersInit => {
  const headers: HeadersInit = {};
  if (includeJson) headers["Content-Type"] = "application/json";

  const token = options.token ?? getStoredAuthToken();
  if (token && token !== COOKIE_SESSION_MARKER) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const parseCategoryResponse = async <T = Category>(
  response: Response,
  fallbackMessage: string,
): Promise<T> => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiResponseError(
      typeof data?.error === "string" && data.error.trim()
        ? data.error
        : fallbackMessage,
      response.status,
    );
  }

  return data as T;
};

class ApiResponseError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiResponseError";
  }
}

const storeRefreshedTokens = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("refreshToken");
  window.dispatchEvent(new Event("auth:session-changed"));
};

const fetchWithAuthRetry = async <T>(
  requestFactory: () => Promise<T>,
  options: ApiOptions = {},
): Promise<T> => {
  const token = options.token ?? getStoredAuthToken();

  if (!token) {
    throw new Error("No hay sesion activa");
  }

  try {
    return await requestFactory();
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    const status = error instanceof ApiResponseError ? error.status : null;
    const canRefreshSession =
      !options.token || options.token === COOKIE_SESSION_MARKER;
    const shouldRetry =
      canRefreshSession &&
      (status === 401 ||
        message.includes("token") ||
        message.includes("jwt") ||
        message.includes("unauthorized") ||
        message.includes("unauthoriz") ||
        message.includes("debes iniciar sesion") ||
        message.includes("sesion"));

    if (!shouldRetry) {
      throw error;
    }

    await refreshSession();
    storeRefreshedTokens();

    return requestFactory();
  }
};

export const createCategory = async (
  input: CategoryInput,
  options: ApiOptions = {},
): Promise<Category> => {
  return fetchWithAuthRetry(async () => {
    const response = await fetch(buildApiUrl("/api/categories", options.baseUrl), {
      method: "POST",
      headers: buildHeaders(options, true),
      body: JSON.stringify(input),
      signal: options.signal,
    });

    return parseCategoryResponse(response, "Error al crear categoria");
  }, options);
};

export const updateCategory = async (
  id: string,
  input: Partial<CategoryInput>,
  options: ApiOptions = {},
): Promise<Category> => {
  return fetchWithAuthRetry(async () => {
    const response = await fetch(
      buildApiUrl(`/api/categories/${id}`, options.baseUrl),
      {
        method: "PATCH",
        headers: buildHeaders(options, true),
        body: JSON.stringify(input),
        signal: options.signal,
      },
    );

    return parseCategoryResponse(response, "Error al actualizar categoria");
  }, options);
};

export const deleteCategory = async (
  id: string,
  options: ApiOptions = {},
): Promise<Category> => {
  return fetchWithAuthRetry(async () => {
    const response = await fetch(
      buildApiUrl(`/api/categories/${id}`, options.baseUrl),
      {
        method: "DELETE",
        headers: buildHeaders(options),
        signal: options.signal,
      },
    );

    return parseCategoryResponse(response, "Error al eliminar categoria");
  }, options);
};

export const uploadCategoryImage = async (
  file: File,
  options: ApiOptions = {},
): Promise<{ url: string; publicId: string }> =>
  uploadCloudinaryImage(file, "categories", options);

export const deleteCategoryImage = async (
  publicId: string,
  options: ApiOptions = {},
): Promise<void> => deleteCloudinaryImage(publicId, options);
