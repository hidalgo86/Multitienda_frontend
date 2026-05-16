import type { NextRequest } from "next/server";
import { getBackendAuthorization } from "../../_utils/security";

type GraphqlPayload<TData> = {
  data?: TData;
  errors?: Array<{ message?: string }>;
};

export const bannerFields = `
  id
  title
  imageUrl
  imagePublicId
  altText
  subtitle
  linkUrl
  ctaLabel
  order
  isActive
  startsAt
  endsAt
  createdAt
  updatedAt
`;

export class BannerApiError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "BannerApiError";
  }
}

const getApiUrl = (): string => {
  const apiUrl = process.env.API_URL?.trim();
  if (!apiUrl) throw new BannerApiError("Falta API_URL", 500);
  return apiUrl;
};

const isAuthErrorMessage = (message: string): boolean => {
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

const buildHeaders = (req: NextRequest): HeadersInit => {
  const authorization = getBackendAuthorization(req);
  return {
    "Content-Type": "application/json",
    ...(authorization ? { Authorization: authorization } : {}),
  };
};

export const executeAdminBannerGraphql = async <
  TData extends Record<string, unknown>,
  TVariables = undefined,
>({
  req,
  query,
  variables,
  fallback,
}: {
  req: NextRequest;
  query: string;
  variables?: TVariables;
  fallback: string;
}): Promise<TData> => {
  const response = await fetch(`${getApiUrl()}/graphql`, {
    method: "POST",
    headers: buildHeaders(req),
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const payload = (await response.json()) as GraphqlPayload<TData>;

  if (!response.ok || payload.errors?.length) {
    const message = payload.errors?.[0]?.message || fallback;
    const status = response.ok
      ? isAuthErrorMessage(message)
        ? 401
        : 400
      : response.status || 500;

    throw new BannerApiError(message, status);
  }

  if (!payload.data) throw new BannerApiError(fallback, 500);

  return payload.data;
};
