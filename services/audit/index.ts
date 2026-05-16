import type { AuditLog, AuditLogFilters } from "@/types/domain/audit";
import {
  COOKIE_SESSION_MARKER,
  getStoredAuthToken,
  refreshSession,
  type PaginatedResult,
} from "@/services/users";

interface AuditApiOptions {
  token?: string | null;
  signal?: AbortSignal;
}

interface ListAdminAuditLogsParams extends AuditLogFilters {
  page?: number;
  limit?: number;
}

const buildHeaders = (token?: string | null): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token && token !== COOKIE_SESSION_MARKER) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const parseResponseOrThrow = async <T>(response: Response): Promise<T> => {
  const data = (await response.json().catch(() => null)) as
    | T
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new ApiResponseError(
      data && typeof (data as { error?: unknown }).error === "string"
        ? String((data as { error: string }).error)
        : "No se pudieron cargar las auditorias",
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

const storeRefreshedTokens = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("refreshToken");
  window.dispatchEvent(new Event("auth:session-changed"));
};

const fetchWithAuthRetry = async <T>(
  requestFactory: (token: string) => Promise<T>,
  options: AuditApiOptions = {},
): Promise<T> => {
  const token = options.token ?? getStoredAuthToken();

  if (!token) {
    throw new Error("No hay sesion activa");
  }

  try {
    return await requestFactory(token);
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
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
        message.includes("sesion"));

    if (!shouldRetry) {
      throw error;
    }

    const refreshedTokens = await refreshSession();
    storeRefreshedTokens();

    return requestFactory(refreshedTokens.access_token);
  }
};

export const listAdminAuditLogs = async (
  params: ListAdminAuditLogsParams = {},
  options: AuditApiOptions = {},
): Promise<PaginatedResult<AuditLog>> => {
  return fetchWithAuthRetry(async (token) => {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 20));
    if (params.actorUserId?.trim()) {
      query.set("actorUserId", params.actorUserId.trim());
    }
    if (params.action?.trim()) query.set("action", params.action.trim());
    if (params.entityType?.trim()) {
      query.set("entityType", params.entityType.trim());
    }
    if (params.entityId?.trim()) query.set("entityId", params.entityId.trim());

    const response = await fetch(`/api/admin/audit?${query.toString()}`, {
      headers: buildHeaders(token),
      cache: "no-store",
      signal: options.signal,
    });

    return parseResponseOrThrow<PaginatedResult<AuditLog>>(response);
  }, options);
};
