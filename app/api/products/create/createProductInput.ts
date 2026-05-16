// src/app/api/products/create/createProductInput.ts 
import { toGraphqlGenre } from "@/lib/graphqlMappers";
import type {
  CreateProductGraphqlInput,
  CreateProductGraphqlVariantInput,
} from "@/types/api/products/graphql";
import { getVariantName, parseGenre } from "@/types/domain/products";
import type { ProductImage } from "@/types/domain/products";
import { CreateProductRouteError } from "./createProduct.error";

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
      throw new CreateProductRouteError(
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
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
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
      throw new CreateProductRouteError(
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

export const buildCreateProductInput = (
  value: unknown,
): CreateProductGraphqlInput => {
  const source = asRecord(value);
  const categoryId = parseOptionalString(source.categoryId);
  const name = parseOptionalString(source.name);

  if (!name || !categoryId) {
    throw new CreateProductRouteError(
      "Faltan campos obligatorios: name y categoryId",
      400,
    );
  }

  if (!isValidMongoId(categoryId)) {
    throw new CreateProductRouteError(
      "categoryId debe ser un ObjectId válido",
      400,
    );
  }

  const thumbnail = parseOptionalString(source.thumbnail);
  if (thumbnail && !isValidUrl(thumbnail)) {
    throw new CreateProductRouteError("thumbnail debe ser una URL válida", 400);
  }

  const productInput: CreateProductGraphqlInput = {
    categoryId,
    name,
  };

  const description = parseOptionalString(source.description);
  if (description) {
    productInput.description = description;
  }

  const brand = parseOptionalString(source.brand);
  if (brand) {
    productInput.brand = brand;
  }

  if (thumbnail) {
    productInput.thumbnail = thumbnail;
  }

  const images = normalizeImages(source.images);
  if (images) {
    productInput.images = images;
  }

  const genreValue = parseOptionalString(source.genre);
  if (genreValue) {
    const parsedGenre = parseGenre(genreValue);
    if (!parsedGenre) {
      throw new CreateProductRouteError(`Género inválido: ${genreValue}`, 400);
    }

    productInput.genre = toGraphqlGenre(parsedGenre);
  }

  const variants = normalizeVariants(source.variants);
  if (variants) {
    productInput.variants = variants;
    return productInput;
  }

  const stock = parseOptionalNumber(source.stock);
  if (stock !== undefined) {
    productInput.stock = stock;
  }

  const price = parseOptionalNumber(source.price);
  if (price !== undefined) {
    productInput.price = price;
  }

  return productInput;
};
