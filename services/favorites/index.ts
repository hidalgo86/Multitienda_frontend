import type { Product } from "@/types/domain/products";
import {
  buildJsonHeaders,
  fetchWithAuthRetry,
  parseResponseOrThrow,
} from "@/lib/apiClient";

interface FavoriteApiOptions {
  token?: string | null;
  signal?: AbortSignal;
}

const ensureProductsArray = (value: unknown): Product[] =>
  Array.isArray(value) ? (value as Product[]) : [];

export const listFavoriteProducts = async (
  options: FavoriteApiOptions = {},
): Promise<Product[]> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/favorites", {
      headers: buildJsonHeaders(token),
      cache: "no-store",
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<unknown>(
      response,
      "Error al sincronizar favoritos",
    );
    return ensureProductsArray(data);
  }, "Error al sincronizar favoritos", options);
};

export const addFavoriteProduct = async (
  productId: string,
  options: FavoriteApiOptions = {},
): Promise<Product[]> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/favorites/add", {
      method: "POST",
      headers: buildJsonHeaders(token),
      body: JSON.stringify({ productId }),
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<unknown>(
      response,
      "Error al sincronizar favoritos",
    );
    return ensureProductsArray(data);
  }, "Error al sincronizar favoritos", options);
};

export const removeFavoriteProduct = async (
  productId: string,
  options: FavoriteApiOptions = {},
): Promise<Product[]> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/favorites/remove", {
      method: "POST",
      headers: buildJsonHeaders(token),
      body: JSON.stringify({ productId }),
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<unknown>(
      response,
      "Error al sincronizar favoritos",
    );
    return ensureProductsArray(data);
  }, "Error al sincronizar favoritos", options);
};

export const clearFavoriteProducts = async (
  options: FavoriteApiOptions = {},
): Promise<void> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/favorites", {
      method: "DELETE",
      headers: buildJsonHeaders(token),
      signal: options.signal,
    });

    await parseResponseOrThrow<{ success: boolean }>(
      response,
      "Error al sincronizar favoritos",
    );
  }, "Error al sincronizar favoritos", options);
};
