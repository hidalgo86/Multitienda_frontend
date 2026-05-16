import type { Product } from "./product";

export enum Size {
  RN = "RN",
  M3 = "M3",
  M6 = "M6",
  M9 = "M9",
  M12 = "M12",
  M18 = "M18",
  M24 = "M24",
  T2 = "T2",
  T3 = "T3",
  T4 = "T4",
  T5 = "T5",
  T6 = "T6",
  T7 = "T7",
  T8 = "T8",
  T9 = "T9",
  T10 = "T10",
  T12 = "T12",
}

export const sizeLabels: Record<Size, string> = {
  [Size.RN]: "RN",
  [Size.M3]: "3M",
  [Size.M6]: "6M",
  [Size.M9]: "9M",
  [Size.M12]: "12M",
  [Size.M18]: "18M",
  [Size.M24]: "24M",
  [Size.T2]: "2T",
  [Size.T3]: "3T",
  [Size.T4]: "4T",
  [Size.T5]: "5T",
  [Size.T6]: "6T",
  [Size.T7]: "7T",
  [Size.T8]: "8T",
  [Size.T9]: "9T",
  [Size.T10]: "10T",
  [Size.T12]: "12T",
};

export const allowedSizes = new Set<Size>(Object.values(Size));

export const formatSizeLabel = (size?: string | Size | null): string => {
  if (!size) return "";
  const normalized = String(size).trim().toUpperCase();
  return sizeLabels[normalized as Size] || String(size);
};

export interface VariantProduct {
  name: string;
  stock: number;
  price: number;
  image?: string;
  size?: Size | string;
}

export const getVariantName = (
  variant?: string | Pick<VariantProduct, "name" | "size"> | null,
): string => {
  if (!variant) return "";
  if (typeof variant === "string") return variant;
  return variant.name || String(variant.size || "");
};

export const formatVariantLabel = (
  variant?: string | Pick<VariantProduct, "name" | "size"> | null,
): string => {
  const value = getVariantName(variant);
  return formatSizeLabel(value);
};

export const hasProductVariants = (
  product?: Pick<Product, "variants"> | null,
): boolean => {
  return Array.isArray(product?.variants) && product.variants.length > 0;
};

export const isVariantProduct = hasProductVariants;

export const getProductPrices = (
  product?: Pick<Product, "variants" | "price"> | null,
): number[] => {
  if (!product) return [];

  if (hasProductVariants(product)) {
    return (product.variants ?? [])
      .map((variant) => Number(variant.price))
      .filter((price) => Number.isFinite(price));
  }

  return [Number(product.price)].filter((price) => Number.isFinite(price));
};

export const getProductStock = (
  product?: Pick<Product, "variants" | "stock"> | null,
): number => {
  if (!product) return 0;

  if (hasProductVariants(product)) {
    return (product.variants ?? []).reduce(
      (total, variant) => total + Math.max(0, Number(variant.stock) || 0),
      0,
    );
  }

  return Math.max(0, Number(product.stock) || 0);
};

export const findVariantBySelection = (
  variants: VariantProduct[] | undefined,
  selection?: string,
): VariantProduct | undefined => {
  if (!Array.isArray(variants) || !selection) return undefined;
  return variants.find((variant) => getVariantName(variant) === selection);
};
