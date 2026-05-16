"use client";

import type { Product } from "@/types/domain/products";

const STORAGE_KEY = "chikitoslandia:recently-viewed";
const MAX_ITEMS = 8;

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const getRecentlyViewedProducts = (): Product[] => {
  if (!canUseStorage()) return [];

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return [];

    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id) : [];
  } catch {
    return [];
  }
};

export const saveRecentlyViewedProduct = (product: Product) => {
  if (!canUseStorage() || !product?.id) return;

  const currentItems = getRecentlyViewedProducts();
  const nextItems = [
    product,
    ...currentItems.filter((item) => item.id !== product.id),
  ].slice(0, MAX_ITEMS);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
  } catch {
    // Storage can fail in private windows or quota-limited devices.
  }
};
