import type { Product } from "@/types/domain/products";
import {
  COOKIE_SESSION_MARKER,
  getStoredAuthToken,
  refreshSession,
} from "@/services/users";

interface FavoriteApiOptions {
  token?: string | null;
  signal?: AbortSignal;
}

const buildHeaders = (token?: string | null): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token && token !== COOKIE_SESSION_MARKER) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const resolveToken = (token?: string | null): string => {
  const resolvedToken = token ?? getStoredAuthToken();
  if (!resolvedToken) {
    throw new Error("No hay sesion activa");
  }
  return resolvedToken;
};

const parseResponseOrThrow = async <T>(response: Response): Promise<T> => {
  const data = (await response.json().catch(() => null)) as
    | T
    | { error?: string }
    | null;

  function hasError(obj: unknown): obj is { error: string } {
    return (
      typeof obj === "object" &&
      obj !== null &&
      "error" in obj &&
      typeof (obj as { error?: unknown }).error === "string"
    );
  }
  if (!response.ok) {
    const errorMsg = hasError(data)
      ? data.error
      : "Error al sincronizar favoritos";
    throw new ApiResponseError(errorMsg, response.status);
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

const ensureProductsArray = (value: unknown): Product[] =>
  Array.isArray(value) ? (value as Product[]) : [];

const storeRefreshedTokens = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("refreshToken");
  window.dispatchEvent(new Event("auth:session-changed"));
};

const fetchWithAuthRetry = async <T>(
  requestFactory: (token: string) => Promise<T>,
  options: FavoriteApiOptions = {},
): Promise<T> => {
  const token = resolveToken(options.token);

  try {
    return await requestFactory(token);
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

    const refreshedTokens = await refreshSession();
    storeRefreshedTokens();

    return requestFactory(refreshedTokens.access_token);
  }
};

export const listFavoriteProducts = async (
  options: FavoriteApiOptions = {},
): Promise<Product[]> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/favorites", {
      headers: buildHeaders(token),
      cache: "no-store",
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<unknown>(response);
    return ensureProductsArray(data);
  }, options);
};

export const addFavoriteProduct = async (
  productId: string,
  options: FavoriteApiOptions = {},
): Promise<Product[]> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/favorites/add", {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify({ productId }),
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<unknown>(response);
    return ensureProductsArray(data);
  }, options);
};

export const removeFavoriteProduct = async (
  productId: string,
  options: FavoriteApiOptions = {},
): Promise<Product[]> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/favorites/remove", {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify({ productId }),
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<unknown>(response);
    return ensureProductsArray(data);
  }, options);
};

export const clearFavoriteProducts = async (
  options: FavoriteApiOptions = {},
): Promise<void> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/favorites", {
      method: "DELETE",
      headers: buildHeaders(token),
      signal: options.signal,
    });

    await parseResponseOrThrow<{ success: boolean }>(response);
  }, options);
};
