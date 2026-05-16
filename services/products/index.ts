import type {
  CreateProduct,
  PaginatedProducts,
  Product,
  ProductImage,
  ProductSearchFilters,
  UploadProduct,
} from "@/types/domain/products";
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
  trackView?: boolean;
}

const genericErrorMessages = new Set([
  "bad request exception",
  "bad request",
  "internal server error",
  "error backend",
  "error del backend",
]);

const isGenericErrorMessage = (value: string): boolean =>
  genericErrorMessages.has(value.trim().toLowerCase());

const extractErrorMessage = (
  value: unknown,
  fallbackErrorMessage: string,
): string => {
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue || fallbackErrorMessage;
  }

  if (Array.isArray(value)) {
    const messages = value
      .map((item) => extractErrorMessage(item, ""))
      .filter(Boolean);

    return messages.join(". ") || fallbackErrorMessage;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    const nestedMessage = [
      record.originalError,
      record.extensions,
      record.exception,
      record.response,
    ]
      .map((item) => extractErrorMessage(item, ""))
      .find(Boolean);

    if (typeof record.message === "string" && record.message.trim()) {
      const message = record.message.trim();
      if (!isGenericErrorMessage(message) || !nestedMessage) {
        return message;
      }
    }

    if (typeof record.error === "string" && record.error.trim()) {
      const errorMessage = record.error.trim();
      if (!isGenericErrorMessage(errorMessage) || !nestedMessage) {
        return errorMessage;
      }
    }

    if (nestedMessage) {
      return nestedMessage;
    }
  }

  return fallbackErrorMessage;
};

const buildApiUrl = (path: string, baseUrl?: string): string => {
  if (!baseUrl) return path;
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
};

const parseResponseOrThrow = async <T>(
  response: Response,
  fallbackErrorMessage: string,
): Promise<T> => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = extractErrorMessage(
      data && (data.error || data.message),
      fallbackErrorMessage,
    );
    throw new ApiResponseError(message, response.status);
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

const buildHeaders = (
  options: ApiOptions,
  includeJson: boolean = false,
  token?: string | null,
): HeadersInit => {
  const headers: HeadersInit = {};

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (token && token !== COOKIE_SESSION_MARKER) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const storeRefreshedTokens = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("refreshToken");
  window.dispatchEvent(new Event("auth:session-changed"));
};

const fetchWithAuthRetry = async <T>(
  requestFactory: (token: string) => Promise<T>,
  fallbackErrorMessage: string,
  options: ApiOptions = {},
): Promise<T> => {
  const token = options.token ?? getStoredAuthToken();

  if (!token) {
    throw new Error("No hay sesion activa");
  }

  try {
    return await requestFactory(token);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.toLowerCase()
        : fallbackErrorMessage.toLowerCase();
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
        message.includes("sesion"));

    if (!shouldRetry) {
      throw error;
    }

    const refreshedTokens = await refreshSession();
    storeRefreshedTokens();

    return requestFactory(refreshedTokens.access_token);
  }
};

export const listProducts = async (
  params: ProductSearchFilters = {},
  options: ApiOptions = {},
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
  options: ApiOptions = {},
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
      headers: buildHeaders(options, false, options.token),
      signal: options.signal,
    },
  );

  return parseResponseOrThrow<Product>(response, "Error al cargar producto");
};

export const createProduct = async (
  input: CreateProduct,
  options: ApiOptions = {},
): Promise<Product> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch(
      buildApiUrl("/api/products/create", options.baseUrl),
      {
        method: "POST",
        headers: buildHeaders(options, true, options.token ?? token),
        body: JSON.stringify(input),
        signal: options.signal,
      },
    );

    return parseResponseOrThrow<Product>(response, "Error al crear producto");
  }, "Error al crear producto", options);
};

export const uploadProductImage = async (
  file: File,
  options: ApiOptions = {},
): Promise<ProductImage> => uploadCloudinaryImage(file, "products", options);

export const deleteProductImage = async (
  publicId: string,
  options: ApiOptions = {},
): Promise<void> => deleteCloudinaryImage(publicId, options);

export const updateProduct = async (
  id: string,
  input: Partial<UploadProduct>,
  options: ApiOptions = {},
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
        headers: buildHeaders(options, true, options.token ?? token),
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
