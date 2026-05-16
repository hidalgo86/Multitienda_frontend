import { toGraphqlGenre, toGraphqlState } from "@/lib/graphqlMappers";
import type {
  CreateProductGraphqlVariantInput,
  UpdateProductGraphqlInput,
} from "@/types/api/products/graphql";
import {
  getVariantName,
  parseGenre,
  parseProductState,
} from "@/types/domain/products";
import type { ProductImage } from "@/types/domain/products";
import { UpdateProductRouteError } from "./updateProduct.error";

type UnknownRecord = Record<string, unknown>;

const isValidMongoId = (value: string): boolean => /^[a-f\d]{24}$/i.test(value);

const isValidUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const asRecord = (value: unknown): UnknownRecord => {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as UnknownRecord;
};

const parseOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized || undefined;
};

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const normalizeImages = (value: unknown): ProductImage[] | undefined => {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }

  return value.map((image) => {
    const source = asRecord(image);
    const url = parseOptionalString(source.url);
    const publicId = parseOptionalString(source.publicId);

    if (!url || !publicId) {
      throw new UpdateProductRouteError(
        "Cada imagen debe incluir url y publicId",
        400,
      );
    }

    return { url, publicId } satisfies ProductImage;
  });
};

const normalizeVariants = (
  value: unknown,
): CreateProductGraphqlVariantInput[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  if (value.length === 0) {
    return [];
  }

  return value.map((variant) => {
    const source = asRecord(variant);
    const name = getVariantName({
      name: parseOptionalString(source.name) || "",
      size: parseOptionalString(source.size),
    }).trim();
    const stock = parseOptionalNumber(source.stock);
    const price = parseOptionalNumber(source.price);

    if (!name || stock === undefined || price === undefined) {
      throw new UpdateProductRouteError(
        "Las variantes deben incluir nombre, stock y precio válidos",
        400,
      );
    }

    const image = parseOptionalString(source.image);

    if (image) {
      return { name, stock, price, image };
    }

    return { name, stock, price };
  });
};

export const buildUpdateProductInput = (
  value: unknown,
): UpdateProductGraphqlInput => {
  const source = asRecord(value);
  const input: UpdateProductGraphqlInput = {};

  const categoryId = parseOptionalString(source.categoryId);
  if (categoryId) {
    if (!isValidMongoId(categoryId)) {
      throw new UpdateProductRouteError(
        "categoryId debe ser un ObjectId válido",
        400,
      );
    }

    input.categoryId = categoryId;
  }

  const name = parseOptionalString(source.name);
  if (name) {
    input.name = name;
  }

  const description = parseOptionalString(source.description);
  if (description) {
    input.description = description;
  }

  const brand = parseOptionalString(source.brand);
  if (brand) {
    input.brand = brand;
  }

  const thumbnail = parseOptionalString(source.thumbnail);
  if (thumbnail && !thumbnail.startsWith("/")) {
    if (!isValidUrl(thumbnail)) {
      throw new UpdateProductRouteError(
        "thumbnail debe ser una URL válida",
        400,
      );
    }

    input.thumbnail = thumbnail;
  }

  const images = normalizeImages(source.images);
  if (images) {
    input.images = images;
  }

  if ("genre" in source && source.genre === null) {
    input.genre = null;
  }

  const genreValue = parseOptionalString(source.genre);
  if (genreValue) {
    const parsedGenre = parseGenre(genreValue);
    if (!parsedGenre) {
      throw new UpdateProductRouteError(`Género inválido: ${genreValue}`, 400);
    }

    input.genre = toGraphqlGenre(parsedGenre);
  }

  const variants = normalizeVariants(source.variants);
  if (variants) {
    input.variants = variants;
  }

  const stock = parseOptionalNumber(source.stock);
  if (stock !== undefined) {
    input.stock = stock;
  }

  const price = parseOptionalNumber(source.price);
  if (price !== undefined) {
    input.price = price;
  }

  const stateValue = parseOptionalString(source.state);
  if (stateValue) {
    const parsedState = parseProductState(stateValue);
    if (!parsedState) {
      throw new UpdateProductRouteError(`Estado inválido: ${stateValue}`, 400);
    }

    input.state = toGraphqlState(parsedState);
  }

  if (Object.keys(input).length === 0) {
    throw new UpdateProductRouteError("No hay campos para actualizar", 400);
  }

  return input;
};
