import type { CartItem } from "@/store/slices/cartSlice";
import {
  COOKIE_SESSION_MARKER,
  getStoredAuthToken,
  refreshSession,
} from "@/services/users";

interface CartApiOptions {
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
      : "Error al sincronizar carrito";
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

const ensureCartItemsArray = (value: unknown): CartItem[] =>
  Array.isArray(value) ? (value as CartItem[]) : [];

const storeRefreshedTokens = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("refreshToken");
  window.dispatchEvent(new Event("auth:session-changed"));
};

const fetchWithAuthRetry = async <T>(
  requestFactory: (token: string) => Promise<T>,
  options: CartApiOptions = {},
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

let replaceRemoteCartQueue = Promise.resolve();

export const listCartItems = async (
  options: CartApiOptions = {},
): Promise<CartItem[]> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/cart", {
      headers: buildHeaders(token),
      cache: "no-store",
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<unknown>(response);
    return ensureCartItemsArray(data);
  }, options);
};

export const upsertCartItem = async (
  input: { productId: string; quantity: number; variantName?: string },
  options: CartApiOptions = {},
): Promise<CartItem[]> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/cart/items", {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify(input),
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<unknown>(response);
    return ensureCartItemsArray(data);
  }, options);
};

export const clearRemoteCart = async (
  options: CartApiOptions = {},
): Promise<void> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/cart", {
      method: "DELETE",
      headers: buildHeaders(token),
      signal: options.signal,
    });

    await parseResponseOrThrow<{ success: boolean }>(response);
  }, options);
};

export const replaceRemoteCart = async (
  items: CartItem[],
  options: CartApiOptions = {},
): Promise<CartItem[]> => {
  const runReplacement = async (): Promise<CartItem[]> => {
    const token = resolveToken(options.token);
    await clearRemoteCart({ ...options, token });

    let nextCart: CartItem[] = [];

    for (const item of items) {
      nextCart = await upsertCartItem(
        {
          productId: item.id,
          quantity: item.quantity,
          variantName: item.selectedSize,
        },
        { ...options, token },
      );
    }

    return nextCart;
  };

  const replacement = replaceRemoteCartQueue.then(runReplacement, runReplacement);
  replaceRemoteCartQueue = replacement.then(
    () => undefined,
    () => undefined,
  );

  return replacement;
};
