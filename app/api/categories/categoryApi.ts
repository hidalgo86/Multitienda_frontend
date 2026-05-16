import type { NextRequest } from "next/server";
import type { Category } from "@/types/domain/products";
import { getBackendAuthorization } from "../_utils/security";

type GraphqlError = { message?: string };
type GraphqlResponse<TData> = {
  data?: TData;
  errors?: GraphqlError[];
};

export class CategoryApiError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "CategoryApiError";
  }
}

const getApiUrl = (): string => {
  const apiUrl = process.env.API_URL?.trim();
  if (!apiUrl) {
    throw new CategoryApiError("Falta API_URL en variables de entorno", 500);
  }
  return apiUrl;
};

const getGraphqlErrorMessage = (errors?: GraphqlError[]): string =>
  errors?.find((error) => error.message?.trim())?.message?.trim() ||
  "Error del backend";

const isAuthGraphqlError = (message: string): boolean => {
  const normalized = message.trim().toLowerCase();
  return (
    normalized.includes("unauthorized") ||
    normalized.includes("no autenticado") ||
    normalized.includes("debes iniciar sesion") ||
    normalized.includes("debes iniciar sesión") ||
    normalized.includes("token") ||
    normalized.includes("jwt") ||
    normalized.includes("sesion") ||
    normalized.includes("sesión")
  );
};

const buildHeaders = (request?: NextRequest): HeadersInit => {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const authorization = getBackendAuthorization(request);
  if (authorization) headers.Authorization = authorization;
  return headers;
};

export const normalizeCategory = (value: unknown): Category | null => {
  const record =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const id = typeof record.id === "string" ? record.id : "";
  const name = typeof record.name === "string" ? record.name : "";
  const slug = typeof record.slug === "string" ? record.slug : "";
  const parentId =
    typeof record.parentId === "string"
      ? record.parentId
      : typeof record.parent === "string"
        ? record.parent
        : undefined;
  const description =
    typeof record.description === "string" ? record.description : undefined;
  const imageUrl =
    typeof record.imageUrl === "string" ? record.imageUrl : undefined;
  const imagePublicId =
    typeof record.imagePublicId === "string" ? record.imagePublicId : null;
  const isFeatured = record.isFeatured === true;
  const displayOrder =
    typeof record.displayOrder === "number" ? record.displayOrder : 0;

  if (!id || !name || !slug) return null;

  return {
    id,
    name,
    slug,
    parentId,
    parent: parentId,
    description,
    imageUrl,
    imagePublicId,
    isFeatured,
    displayOrder,
  };
};

export const executeCategoryGraphql = async <
  TData extends Record<string, unknown>,
  TVariables = undefined,
>({
  query,
  variables,
  request,
}: {
  query: string;
  variables?: TVariables;
  request?: NextRequest;
}): Promise<TData> => {
  const response = await fetch(`${getApiUrl()}/graphql`, {
    method: "POST",
    headers: buildHeaders(request),
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const payload = (await response.json()) as GraphqlResponse<TData>;

  if (!response.ok || payload.errors?.length) {
    const message = getGraphqlErrorMessage(payload.errors);
    const status = response.ok
      ? isAuthGraphqlError(message)
        ? 401
        : 400
      : response.status || 500;

    throw new CategoryApiError(message, status);
  }

  if (!payload.data) {
    throw new CategoryApiError("Respuesta invalida del backend", 500);
  }

  return payload.data;
};

export const categoryFields = `
  id
  name
  slug
  parentId
  description
  imageUrl
  imagePublicId
  isFeatured
  displayOrder
`;

export const readCategoryFromData = (
  data: Record<string, unknown>,
  key: string,
): Category => {
  const category = normalizeCategory(data[key]);

  if (!category) {
    throw new CategoryApiError("Respuesta invalida del backend", 500);
  }

  return category;
};

export const readCategoriesFromData = (
  data?: Record<string, unknown>,
): Category[] => {
  if (!data) return [];

  const candidates = [
    data.categories,
    data.getCategories,
    typeof data.categories === "object" && data.categories !== null
      ? (data.categories as Record<string, unknown>).items
      : undefined,
    typeof data.getCategories === "object" && data.getCategories !== null
      ? (data.getCategories as Record<string, unknown>).items
      : undefined,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const categories = candidate
      .map(normalizeCategory)
      .filter(Boolean) as Category[];

    if (categories.length > 0) return categories;
  }

  return [];
};
