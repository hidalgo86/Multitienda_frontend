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

const normalizeCategory = (value: unknown): Category => {
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

  if (!id || !name || !slug) {
    throw new CategoryApiError("Respuesta invalida del backend", 500);
  }

  return { id, name, slug, parentId, parent: parentId };
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
`;

export const readCategoryFromData = (
  data: Record<string, unknown>,
  key: string,
): Category => normalizeCategory(data[key]);
