import {
  COOKIE_SESSION_MARKER,
  getStoredAuthToken,
  refreshSession,
} from "@/services/users";
import type {
  Banner,
  CreateBannerInput,
  UpdateBannerInput,
} from "@/types/domain/banners";
import { isAllowedRemoteImageUrl } from "@/lib/imageHosts";
import {
  deleteCloudinaryImage,
  uploadCloudinaryImage,
} from "@/services/cloudinary-images";

interface ApiOptions {
  baseUrl?: string;
  cache?: RequestCache;
  signal?: AbortSignal;
  token?: string | null;
}

type RawBanner = Partial<Banner> & { _id?: string | null };
const BANNER_PLACEHOLDER = "/placeholder.webp";

const normalizeImageUrl = (value: unknown): string => {
  if (typeof value !== "string") return BANNER_PLACEHOLDER;

  const url = value.trim();
  if (!url) return BANNER_PLACEHOLDER;
  if (url.startsWith("/")) return url;

  return isAllowedRemoteImageUrl(url) ? url : BANNER_PLACEHOLDER;
};

const normalizeIdentifier = (value: unknown): string => {
  if (typeof value !== "string") return "";

  const normalizedValue = value.trim();
  if (
    !normalizedValue ||
    normalizedValue === "undefined" ||
    normalizedValue === "null"
  ) {
    return "";
  }

  return normalizedValue;
};

const buildApiUrl = (path: string, baseUrl?: string): string => {
  if (!baseUrl) return path;
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
};

const parseResponseOrThrow = async <T>(
  response: Response,
  fallbackErrorMessage: string,
): Promise<T> => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiResponseError(
      typeof data?.error === "string" && data.error.trim()
        ? data.error
        : fallbackErrorMessage,
      response.status,
    );
  }

  return data as T;
};

class ApiResponseError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiResponseError";
  }
}

const normalizeBanner = (raw: RawBanner): Banner => ({
  id: normalizeIdentifier(raw.id) || normalizeIdentifier(raw._id),
  title: String(raw.title ?? ""),
  imageUrl: normalizeImageUrl(raw.imageUrl),
  imagePublicId:
    typeof raw.imagePublicId === "string" ? raw.imagePublicId : null,
  altText: String(raw.altText ?? ""),
  subtitle: String(raw.subtitle ?? ""),
  linkUrl: typeof raw.linkUrl === "string" ? raw.linkUrl : null,
  ctaLabel: String(raw.ctaLabel ?? ""),
  order: Number(raw.order ?? 0),
  isActive: Boolean(raw.isActive),
  startsAt: typeof raw.startsAt === "string" ? raw.startsAt : null,
  endsAt: typeof raw.endsAt === "string" ? raw.endsAt : null,
  createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
  updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
});

const normalizeBannerList = (value: unknown): Banner[] =>
  Array.isArray(value)
    ? value.map((item) => normalizeBanner((item ?? {}) as RawBanner))
    : [];

const buildHeaders = (
  includeJson: boolean = false,
  token?: string | null,
): HeadersInit => {
  const headers: HeadersInit = {};
  if (includeJson) headers["Content-Type"] = "application/json";
  if (token && token !== COOKIE_SESSION_MARKER) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const storeRefreshedTokens = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("refreshToken");
  window.dispatchEvent(new Event("auth:session-changed"));
};

const fetchWithAuthRetry = async <T>(
  requestFactory: (token: string) => Promise<T>,
  fallbackErrorMessage: string,
  options: ApiOptions = {},
): Promise<T> => {
  const token = options.token ?? getStoredAuthToken();

  if (!token) {
    throw new Error("No hay sesion activa");
  }

  try {
    return await requestFactory(token);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.toLowerCase()
        : fallbackErrorMessage.toLowerCase();
    const status = error instanceof ApiResponseError ? error.status : null;

    const canRefreshSession =
      !options.token || options.token === COOKIE_SESSION_MARKER;

    const shouldRetry =
      canRefreshSession &&
      (status === 401 ||
        message.includes("token") ||
        message.includes("jwt") ||
        message.includes("unauthorized") ||
        message.includes("sesion"));

    if (!shouldRetry) {
      throw error;
    }

    const refreshedTokens = await refreshSession();
    storeRefreshedTokens();
    return requestFactory(refreshedTokens.access_token);
  }
};

export const listPublicBanners = async (
  options: ApiOptions = {},
): Promise<Banner[]> => {
  const response = await fetch(buildApiUrl("/api/banners", options.baseUrl), {
    cache: options.cache ?? "no-store",
    signal: options.signal,
  });

  const data = await parseResponseOrThrow<unknown[]>(
    response,
    "Error al cargar banners",
  );

  return normalizeBannerList(data);
};

export const listAdminBanners = async (
  options: ApiOptions = {},
): Promise<Banner[]> =>
  fetchWithAuthRetry(async (token) => {
    const response = await fetch(
      buildApiUrl("/api/admin/banners", options.baseUrl),
      {
        cache: options.cache ?? "no-store",
        headers: buildHeaders(false, options.token ?? token),
        signal: options.signal,
      },
    );

    const data = await parseResponseOrThrow<unknown[]>(
      response,
      "Error al cargar banners",
    );

    return normalizeBannerList(data);
  }, "Error al cargar banners", options);

export const createBanner = async (
  input: CreateBannerInput,
  options: ApiOptions = {},
): Promise<Banner> =>
  fetchWithAuthRetry(async (token) => {
    const response = await fetch(
      buildApiUrl("/api/admin/banners", options.baseUrl),
      {
        method: "POST",
        headers: buildHeaders(true, options.token ?? token),
        body: JSON.stringify(input),
        signal: options.signal,
      },
    );

    const data = await parseResponseOrThrow<RawBanner>(
      response,
      "Error al crear banner",
    );

    return normalizeBanner(data);
  }, "Error al crear banner", options);

export const updateBanner = async (
  id: string,
  input: UpdateBannerInput,
  options: ApiOptions = {},
): Promise<Banner> =>
  fetchWithAuthRetry(async (token) => {
    const normalizedId = normalizeIdentifier(id);

    if (!normalizedId) {
      throw new Error("El banner no tiene un identificador valido");
    }

    const response = await fetch(
      buildApiUrl(`/api/admin/banners/${normalizedId}`, options.baseUrl),
      {
        method: "PATCH",
        headers: buildHeaders(true, options.token ?? token),
        body: JSON.stringify(input),
        signal: options.signal,
      },
    );

    const data = await parseResponseOrThrow<RawBanner>(
      response,
      "Error al actualizar banner",
    );

    return normalizeBanner(data);
  }, "Error al actualizar banner", options);

export const deleteBanner = async (
  id: string,
  options: ApiOptions = {},
): Promise<Banner> =>
  fetchWithAuthRetry(async (token) => {
    const normalizedId = normalizeIdentifier(id);

    if (!normalizedId) {
      throw new Error("El banner no tiene un identificador valido");
    }

    const response = await fetch(
      buildApiUrl(`/api/admin/banners/${normalizedId}`, options.baseUrl),
      {
        method: "DELETE",
        headers: buildHeaders(false, options.token ?? token),
        signal: options.signal,
      },
    );

    const data = await parseResponseOrThrow<RawBanner>(
      response,
      "Error al eliminar banner",
    );

    return normalizeBanner(data);
  }, "Error al eliminar banner", options);

export const uploadBannerImage = async (
  file: File,
  options: ApiOptions = {},
): Promise<{ url: string; publicId: string }> =>
  uploadCloudinaryImage(file, "banners", options);

export const deleteBannerImage = async (
  publicId: string,
  options: ApiOptions = {},
): Promise<void> => deleteCloudinaryImage(publicId, options);
