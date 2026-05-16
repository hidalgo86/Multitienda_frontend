import {
  Genre,
  ProductAvailability,
  ProductSortBy,
  ProductState,
} from "@/types/domain/products";

export const toGraphqlAvailability = (
  availability?: ProductAvailability,
): "DISPONIBLE" | "AGOTADO" | undefined => {
  if (!availability) return undefined;

  if (availability === ProductAvailability.DISPONIBLE) {
    return "DISPONIBLE";
  }

  if (availability === ProductAvailability.AGOTADO) {
    return "AGOTADO";
  }

  return undefined;
};

export const toGraphqlState = (
  state?: ProductState,
): "ACTIVO" | "ELIMINADO" | undefined => {
  if (!state) return undefined;
  return state === ProductState.ACTIVO ? "ACTIVO" : "ELIMINADO";
};

export const toGraphqlGenre = (
  genre?: Genre,
): "NINA" | "NINO" | "UNISEX" | undefined => {
  if (!genre) return undefined;
  if (genre === Genre.NINA) return "NINA";
  if (genre === Genre.NINO) return "NINO";
  return "UNISEX";
};

export const toGraphqlProductSortBy = (
  sortBy?: ProductSortBy,
):
  | "NEWEST"
  | "OLDEST"
  | "PRICE_ASC"
  | "PRICE_DESC"
  | "NAME_ASC"
  | "NAME_DESC"
  | "MOST_PURCHASED"
  | "MOST_VIEWED"
  | "MOST_FAVORITED"
  | "MOST_CART_ADDED"
  | "MOST_SEARCHED"
  | undefined => {
  if (!sortBy) return undefined;

  const sortMap: Record<
    ProductSortBy,
    NonNullable<ReturnType<typeof toGraphqlProductSortBy>>
  > = {
    [ProductSortBy.NEWEST]: "NEWEST",
    [ProductSortBy.OLDEST]: "OLDEST",
    [ProductSortBy.PRICE_ASC]: "PRICE_ASC",
    [ProductSortBy.PRICE_DESC]: "PRICE_DESC",
    [ProductSortBy.NAME_ASC]: "NAME_ASC",
    [ProductSortBy.NAME_DESC]: "NAME_DESC",
    [ProductSortBy.MOST_PURCHASED]: "MOST_PURCHASED",
    [ProductSortBy.MOST_VIEWED]: "MOST_VIEWED",
    [ProductSortBy.MOST_FAVORITED]: "MOST_FAVORITED",
    [ProductSortBy.MOST_CART_ADDED]: "MOST_CART_ADDED",
    [ProductSortBy.MOST_SEARCHED]: "MOST_SEARCHED",
  };

  return sortMap[sortBy];
};
