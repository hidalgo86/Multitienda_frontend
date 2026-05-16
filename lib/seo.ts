import type { Product } from "@/types/domain/products";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "http://localhost:3000";

export const absoluteUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalizedPath}`;
};

export const getProductUrlPath = (product: Pick<Product, "id">): string =>
  `/products/${product.id}`;

export const getProductImageUrl = (product: Product): string =>
  product.images?.[0]?.url || product.thumbnail || absoluteUrl("/placeholder.webp");

export const getProductPrice = (product: Product): number | null => {
  const variantPrices = (product.variants ?? [])
    .map((variant) => Number(variant.price))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (variantPrices.length > 0) {
    return Math.min(...variantPrices);
  }

  const directPrice = Number(product.price);
  return Number.isFinite(directPrice) && directPrice > 0 ? directPrice : null;
};

export const getProductDescription = (product: Product): string =>
  product.description?.trim() ||
  `${product.name} disponible en Chikitoslandia.`;
