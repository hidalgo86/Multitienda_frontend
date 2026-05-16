import type { Product } from "./product";

export enum ProductState {
  ACTIVO = "activo",
  ELIMINADO = "eliminado",
}

const allowedStates = new Set<ProductState>(Object.values(ProductState));

export const parseProductState = (
  state?: string | ProductState | null,
): ProductState | null => {
  if (!state) return null;
  const normalized = String(state).trim().toLowerCase() as ProductState;
  return allowedStates.has(normalized) ? normalized : null;
};

export enum ProductAvailability {
  DISPONIBLE = "disponible",
  AGOTADO = "agotado",
}

const allowedAvailabilities = new Set<ProductAvailability>(
  Object.values(ProductAvailability),
);

export const parseProductAvailability = (
  availability?: string | ProductAvailability | null,
): ProductAvailability | null => {
  if (!availability) return null;
  const normalized = String(availability)
    .trim()
    .toLowerCase() as ProductAvailability;
  return allowedAvailabilities.has(normalized) ? normalized : null;
};

export enum ProductStatus {
  DISPONIBLE = ProductAvailability.DISPONIBLE,
  AGOTADO = ProductAvailability.AGOTADO,
  ELIMINADO = ProductState.ELIMINADO,
}

export const parseProductStatus = (
  status?: string | ProductStatus | ProductState | ProductAvailability | null,
): ProductStatus | null => {
  if (!status) return null;
  const normalized = String(status).trim().toLowerCase();
  if (normalized === ProductState.ELIMINADO) {
    return ProductStatus.ELIMINADO;
  }
  if (normalized === ProductAvailability.DISPONIBLE) {
    return ProductStatus.DISPONIBLE;
  }
  if (normalized === ProductAvailability.AGOTADO) {
    return ProductStatus.AGOTADO;
  }
  return null;
};

export const getProductStatus = (
  product?: Pick<Product, "state" | "availability" | "status"> | null,
): ProductStatus | null => {
  if (!product) return null;
  if (product.status) return parseProductStatus(product.status);
  if (product.state === ProductState.ELIMINADO) {
    return ProductStatus.ELIMINADO;
  }
  if (product.availability) {
    return parseProductStatus(product.availability);
  }
  return null;
};

export const getProductStatusLabel = (
  product?: Pick<Product, "state" | "availability" | "status"> | null,
): string => {
  return getProductStatus(product) || "";
};

export const ADMIN_PRODUCT_FILTER_ALL = "all";

export type AdminProductFilter =
  | ProductAvailability
  | ProductState.ELIMINADO
  | typeof ADMIN_PRODUCT_FILTER_ALL;

export const parseAdminProductFilter = (
  value?: string | AdminProductFilter | null,
): AdminProductFilter | null => {
  if (!value) return null;
  if (value === ADMIN_PRODUCT_FILTER_ALL) {
    return ADMIN_PRODUCT_FILTER_ALL;
  }
  const parsedAvailability = parseProductAvailability(value);
  if (parsedAvailability) {
    return parsedAvailability;
  }

  return parseProductState(value) === ProductState.ELIMINADO
    ? ProductState.ELIMINADO
    : null;
};
