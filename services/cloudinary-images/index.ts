import {
  COOKIE_SESSION_MARKER,
  getStoredAuthToken,
  refreshSession,
} from "@/services/users";

interface ApiOptions {
  baseUrl?: string;
  signal?: AbortSignal;
  token?: string | null;
}

export type CloudinaryFolder = "products" | "banners" | "categories" | "logos";

export interface UploadedCloudinaryImage {
  url: string;
  publicId: string;
}

class ApiResponseError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiResponseError";
  }
}

const buildApiUrl = (path: string, baseUrl?: string): string => {
  if (!baseUrl) return path;
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
};

const buildHeaders = (options: ApiOptions, includeJson = false): HeadersInit => {
  const headers: HeadersInit = {};
  if (includeJson) headers["Content-Type"] = "application/json";

  const token = options.token ?? getStoredAuthToken();
  if (token && token !== COOKIE_SESSION_MARKER) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const parseResponseOrThrow = async <T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiResponseError(
      typeof data?.error === "string" && data.error.trim()
        ? data.error
        : fallbackMessage,
      response.status,
    );
  }

  return data as T;
};

const storeRefreshedTokens = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("refreshToken");
  window.dispatchEvent(new Event("auth:session-changed"));
};

const fetchWithAuthRetry = async <T>(
  requestFactory: () => Promise<T>,
  options: ApiOptions,
  fallbackMessage: string,
): Promise<T> => {
  const token = options.token ?? getStoredAuthToken();

  if (!token) {
    throw new Error("No hay sesion activa");
  }

  try {
    return await requestFactory();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.toLowerCase()
        : fallbackMessage.toLowerCase();
    const status = error instanceof ApiResponseError ? error.status : null;
    const canRefreshSession =
      !options.token || options.token === COOKIE_SESSION_MARKER;
    const shouldRetry =
      canRefreshSession &&
      (status === 401 ||
        message.includes("token") ||
        message.includes("jwt") ||
        message.includes("unauthorized") ||
        message.includes("unauthoriz") ||
        message.includes("debes iniciar sesion") ||
        message.includes("sesion"));

    if (!shouldRetry) throw error;

    await refreshSession();
    storeRefreshedTokens();

    return requestFactory();
  }
};

export const uploadCloudinaryImage = async (
  file: File,
  folder: CloudinaryFolder,
  options: ApiOptions = {},
): Promise<UploadedCloudinaryImage> =>
  fetchWithAuthRetry(async () => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch(
      buildApiUrl("/api/cloudinary/upload", options.baseUrl),
      {
        method: "POST",
        body: formData,
        signal: options.signal,
      },
    );

    return parseResponseOrThrow<UploadedCloudinaryImage>(
      response,
      "Error subiendo imagen",
    );
  }, options, "Error subiendo imagen");

export const deleteCloudinaryImage = async (
  publicId: string,
  options: ApiOptions = {},
): Promise<void> =>
  fetchWithAuthRetry(async () => {
    const response = await fetch(
      buildApiUrl("/api/cloudinary/upload", options.baseUrl),
      {
        method: "DELETE",
        headers: buildHeaders(options, true),
        body: JSON.stringify({ publicId }),
        signal: options.signal,
      },
    );

    await parseResponseOrThrow<{ success: boolean }>(
      response,
      "Error eliminando imagen",
    );
  }, options, "Error eliminando imagen");
