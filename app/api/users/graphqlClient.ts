import type { NextRequest } from "next/server";
import { UserApiRouteError } from "./userApi.error";
import { getBackendAuthorization } from "../_utils/security";

type GraphqlError = {
  message?: string;
};

type GraphqlResponse<TData> = {
  data?: TData;
  errors?: GraphqlError[];
};

type ExecuteGraphqlOptions<TVariables> = {
  query: string;
  variables?: TVariables;
  request?: NextRequest;
};

const getApiUrl = (): string => {
  const apiUrl = process.env.API_URL?.trim();

  if (!apiUrl) {
    throw new UserApiRouteError("Falta API_URL en variables de entorno", 500);
  }

  return apiUrl;
};

const getGraphqlErrorMessage = (errors?: GraphqlError[]): string => {
  const message = errors?.find((error) => error.message?.trim())?.message?.trim();
  return message || "Error del backend";
};

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
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const authorization = getBackendAuthorization(request);
  if (authorization) {
    headers.Authorization = authorization;
  }

  return headers;
};

export const executeUsersGraphql = async <TData, TVariables = undefined>({
  query,
  variables,
  request,
}: ExecuteGraphqlOptions<TVariables>): Promise<TData> => {
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

    throw new UserApiRouteError(message, status);
  }

  if (!payload.data) {
    throw new UserApiRouteError("Respuesta invalida del backend", 500);
  }

  return payload.data;
};
