import type { CartItem } from "@/store/slices/cartSlice";
import {
  buildJsonHeaders,
  fetchWithAuthRetry,
  parseResponseOrThrow,
  resolveAuthToken,
} from "@/lib/apiClient";

interface CartApiOptions {
  token?: string | null;
  signal?: AbortSignal;
}

const ensureCartItemsArray = (value: unknown): CartItem[] =>
  Array.isArray(value) ? (value as CartItem[]) : [];

let replaceRemoteCartQueue = Promise.resolve();

export const listCartItems = async (
  options: CartApiOptions = {},
): Promise<CartItem[]> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/cart", {
      headers: buildJsonHeaders(token),
      cache: "no-store",
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<unknown>(
      response,
      "Error al sincronizar carrito",
    );
    return ensureCartItemsArray(data);
  }, "Error al sincronizar carrito", options);
};

export const upsertCartItem = async (
  input: { productId: string; quantity: number; variantName?: string },
  options: CartApiOptions = {},
): Promise<CartItem[]> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/cart/items", {
      method: "POST",
      headers: buildJsonHeaders(token),
      body: JSON.stringify(input),
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<unknown>(
      response,
      "Error al sincronizar carrito",
    );
    return ensureCartItemsArray(data);
  }, "Error al sincronizar carrito", options);
};

export const clearRemoteCart = async (
  options: CartApiOptions = {},
): Promise<void> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/cart", {
      method: "DELETE",
      headers: buildJsonHeaders(token),
      signal: options.signal,
    });

    await parseResponseOrThrow<{ success: boolean }>(
      response,
      "Error al sincronizar carrito",
    );
  }, "Error al sincronizar carrito", options);
};

export const replaceRemoteCart = async (
  items: CartItem[],
  options: CartApiOptions = {},
): Promise<CartItem[]> => {
  const runReplacement = async (): Promise<CartItem[]> => {
    const token = resolveAuthToken(options.token);
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
