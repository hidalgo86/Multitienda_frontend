import type {
  ChangePasswordApiResponse,
  ForgotPasswordApiResponse,
  ForgotUsernameApiResponse,
  LoginUserApiResponse,
  MeApiResponse,
  RefreshTokenApiResponse,
  RegisterUserApiResponse,
  ResendVerificationApiResponse,
  ResetPasswordApiResponse,
  UpdateProfileApiResponse,
  VerifyEmailApiResponse,
} from "@/types/api/users";
import type {
  AuthSession,
  ChangePasswordInput,
  EmailInput,
  LoginUserInput,
  RegisterUserInput,
  ResendVerificationInput,
  ResetPasswordInput,
  UpdateProfileInput,
  User,
  VerifyEmailInput,
} from "@/types/domain/users";
import {
  ApiResponseError,
  buildApiUrl,
  parseResponseOrThrow,
} from "@/lib/http";

interface ApiOptions {
  baseUrl?: string;
  cache?: RequestCache;
  signal?: AbortSignal;
  token?: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

const AUTH_TOKEN_KEY = "authToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_DATA_KEY = "userData";
const AUTH_SESSION_EVENT = "auth:session-changed";
export const COOKIE_SESSION_MARKER = "__cookie_session__";

let refreshSessionInFlight: Promise<RefreshTokenApiResponse> | null = null;

const buildHeaders = (options: ApiOptions, includeJson = false): HeadersInit => {
  const headers: HeadersInit = {};

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token && options.token !== COOKIE_SESSION_MARKER) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  return headers;
};

const isUnauthorizedError = (error: unknown): boolean =>
  error instanceof ApiResponseError && error.status === 401;

const isBrowser = (): boolean => typeof window !== "undefined";

const notifyAuthSessionChange = (): void => {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
};

const toStoredUser = (user: User): User => ({
  id: user.id,
  username: user.username,
  email: "",
  isEmailVerified: user.isEmailVerified,
  status: user.status,
  role: user.role,
});

export const getStoredAuthToken = (): string | null => {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(USER_DATA_KEY) ? COOKIE_SESSION_MARKER : null;
};

export const getStoredRefreshToken = (): string | null => {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const getStoredUser = (): User | null => {
  if (!isBrowser()) return null;

  const raw = window.localStorage.getItem(USER_DATA_KEY);
  if (!raw) return null;

  try {
    const user = JSON.parse(raw) as User;
    const storedUser = toStoredUser(user);

    if (JSON.stringify(user) !== JSON.stringify(storedUser)) {
      window.localStorage.setItem(USER_DATA_KEY, JSON.stringify(storedUser));
    }

    return storedUser;
  } catch {
    clearStoredSession();
    return null;
  }
};

export const isStoredAdminUser = (): boolean =>
  getStoredUser()?.role?.trim().toLowerCase() === "administrador";

export const storeAuthSession = (session: AuthSession): void => {
  if (!isBrowser()) return;

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.setItem(USER_DATA_KEY, JSON.stringify(toStoredUser(session.user)));
  notifyAuthSessionChange();
};

export const updateStoredUser = (user: User): void => {
  if (!isBrowser()) return;
  window.localStorage.setItem(USER_DATA_KEY, JSON.stringify(toStoredUser(user)));
};

const storeTokens = (): void => {
  if (!isBrowser()) return;

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  notifyAuthSessionChange();
};

export const clearStoredSession = (): void => {
  if (!isBrowser()) return;

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_DATA_KEY);
  void fetch("/api/users/logout", {
    method: "POST",
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => undefined);
  notifyAuthSessionChange();
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );

    return JSON.parse(window.atob(paddedPayload)) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const isAuthTokenExpired = (token?: string | null): boolean => {
  if (!token) return true;
  if (token === COOKIE_SESSION_MARKER) return false;
  if (!isBrowser()) return false;

  const payload = decodeJwtPayload(token);
  const expiresAt = typeof payload?.exp === "number" ? payload.exp : null;
  if (!expiresAt) return false;

  return expiresAt * 1000 <= Date.now() + 5000;
};

export const getValidStoredAuthToken = (): string | null => {
  const token = getStoredAuthToken();
  if (!token) return null;

  if (isAuthTokenExpired(token)) {
    clearStoredSession();
    return null;
  }

  return token;
};

export const registerUser = async (
  input: RegisterUserInput,
  options: ApiOptions = {},
): Promise<RegisterUserApiResponse> => {
  const response = await fetch(buildApiUrl("/api/users/create", options.baseUrl), {
    method: "POST",
    headers: buildHeaders(options, true),
    body: JSON.stringify(input),
    credentials: "same-origin",
    signal: options.signal,
  });

  return parseResponseOrThrow<RegisterUserApiResponse>(
    response,
    "Error al registrar usuario",
  );
};

export const loginUser = async (
  input: LoginUserInput,
  options: ApiOptions = {},
): Promise<LoginUserApiResponse> => {
  const response = await fetch(buildApiUrl("/api/users/login", options.baseUrl), {
    method: "POST",
    headers: buildHeaders(options, true),
    body: JSON.stringify(input),
    credentials: "same-origin",
    signal: options.signal,
  });

  return parseResponseOrThrow<LoginUserApiResponse>(
    response,
    "Error al iniciar sesion",
  );
};

export const forgotUsername = async (
  input: EmailInput,
  options: ApiOptions = {},
): Promise<ForgotUsernameApiResponse> => {
  const response = await fetch(
    buildApiUrl("/api/users/forgot-username", options.baseUrl),
    {
      method: "POST",
      headers: buildHeaders(options, true),
      body: JSON.stringify(input),
      signal: options.signal,
    },
  );

  return parseResponseOrThrow<ForgotUsernameApiResponse>(
    response,
    "Error al recuperar usuario",
  );
};

export const forgotPassword = async (
  input: EmailInput,
  options: ApiOptions = {},
): Promise<ForgotPasswordApiResponse> => {
  const response = await fetch(
    buildApiUrl("/api/users/forgot-password", options.baseUrl),
    {
      method: "POST",
      headers: buildHeaders(options, true),
      body: JSON.stringify(input),
      signal: options.signal,
    },
  );

  return parseResponseOrThrow<ForgotPasswordApiResponse>(
    response,
    "Error al solicitar recuperacion de contrasena",
  );
};

export const verifyEmail = async (
  input: VerifyEmailInput,
  options: ApiOptions = {},
): Promise<VerifyEmailApiResponse> => {
  const response = await fetch(buildApiUrl("/api/users/verify", options.baseUrl), {
    method: "POST",
    headers: buildHeaders(options, true),
    body: JSON.stringify(input),
    signal: options.signal,
  });

  return parseResponseOrThrow<VerifyEmailApiResponse>(
    response,
    "Error al verificar el correo",
  );
};

export const resendVerification = async (
  input: ResendVerificationInput,
  options: ApiOptions = {},
): Promise<ResendVerificationApiResponse> => {
  const response = await fetch(
    buildApiUrl("/api/users/resend-verification", options.baseUrl),
    {
      method: "POST",
      headers: buildHeaders(options, true),
      body: JSON.stringify(input),
      signal: options.signal,
    },
  );

  return parseResponseOrThrow<ResendVerificationApiResponse>(
    response,
    "Error al reenviar la verificacion",
  );
};

export const resetPassword = async (
  input: ResetPasswordInput,
  options: ApiOptions = {},
): Promise<ResetPasswordApiResponse> => {
  const response = await fetch(
    buildApiUrl("/api/users/reset-password", options.baseUrl),
    {
      method: "POST",
      headers: buildHeaders(options, true),
      body: JSON.stringify(input),
      signal: options.signal,
    },
  );

  return parseResponseOrThrow<ResetPasswordApiResponse>(
    response,
    "Error al restablecer la contrasena",
  );
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
  } catch (requestError) {
    const message =
      requestError instanceof Error
        ? requestError.message.toLowerCase()
        : fallbackErrorMessage.toLowerCase();

    const canRefreshSession =
      !options.token || options.token === COOKIE_SESSION_MARKER;

    const shouldRetry =
      canRefreshSession &&
      (isUnauthorizedError(requestError) ||
        message.includes("token") ||
        message.includes("jwt") ||
        message.includes("unauthorized") ||
        message.includes("unauthoriz") ||
        message.includes("debes iniciar sesion") ||
        message.includes("sesion"));

    if (!shouldRetry) {
      throw requestError;
    }

    let refreshedTokens: RefreshTokenApiResponse;

    try {
      refreshedTokens = await refreshSession(options);
      storeTokens();
    } catch (refreshError) {
      clearStoredSession();
      throw refreshError;
    }

    return requestFactory(refreshedTokens.access_token);
  }
};

export const getCurrentUser = async (
  options: ApiOptions = {},
): Promise<MeApiResponse> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch(buildApiUrl("/api/users/me", options.baseUrl), {
      headers: buildHeaders({ ...options, token }),
      cache: options.cache ?? "no-store",
      signal: options.signal,
    });

    return parseResponseOrThrow<MeApiResponse>(
      response,
      "Error al obtener el perfil",
    );
  }, "Error al obtener el perfil", options);
};

export const updateProfile = async (
  input: UpdateProfileInput,
  options: ApiOptions = {},
): Promise<UpdateProfileApiResponse> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch(
      buildApiUrl("/api/users/update-profile", options.baseUrl),
      {
        method: "PATCH",
        headers: buildHeaders({ ...options, token }, true),
        body: JSON.stringify(input),
        signal: options.signal,
      },
    );

    return parseResponseOrThrow<UpdateProfileApiResponse>(
      response,
      "Error al actualizar el perfil",
    );
  }, "Error al actualizar el perfil", options);
};

export const changePassword = async (
  input: ChangePasswordInput,
  options: ApiOptions = {},
): Promise<ChangePasswordApiResponse> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch(
      buildApiUrl("/api/users/change-password", options.baseUrl),
      {
        method: "POST",
        headers: buildHeaders({ ...options, token }, true),
        body: JSON.stringify(input),
        signal: options.signal,
      },
    );

    return parseResponseOrThrow<ChangePasswordApiResponse>(
      response,
      "Error al cambiar la contrasena",
    );
  }, "Error al cambiar la contrasena", options);
};

export const requestAccountDeletion = async (
  options: ApiOptions = {},
): Promise<{ message: string }> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch(
      buildApiUrl("/api/users/request-account-deletion", options.baseUrl),
      {
        method: "POST",
        headers: buildHeaders({ ...options, token }, true),
        signal: options.signal,
      },
    );

    return parseResponseOrThrow<{ message: string }>(
      response,
      "Error al solicitar la eliminacion de cuenta",
    );
  }, "Error al solicitar la eliminacion de cuenta", options);
};

export const confirmAccountDeletion = async (
  code: string,
  options: ApiOptions = {},
): Promise<{ message: string }> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch(
      buildApiUrl("/api/users/confirm-account-deletion", options.baseUrl),
      {
        method: "POST",
        headers: buildHeaders({ ...options, token }, true),
        body: JSON.stringify({ code }),
        signal: options.signal,
      },
    );

    return parseResponseOrThrow<{ message: string }>(
      response,
      "Error al eliminar la cuenta",
    );
  }, "Error al eliminar la cuenta", options);
};

interface ListAdminUsersParams {
  page?: number;
  limit?: number;
  username?: string;
  email?: string;
  role?: string;
  status?: string;
  isEmailVerified?: boolean;
}

export const listAdminUsers = async (
  params: ListAdminUsersParams = {},
  options: ApiOptions = {},
): Promise<PaginatedResult<User>> => {
  return fetchWithAuthRetry(async (token) => {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 20));
    if (params.username?.trim()) query.set("username", params.username.trim());
    if (params.email?.trim()) query.set("email", params.email.trim());
    if (params.role?.trim()) query.set("role", params.role.trim());
    if (params.status?.trim()) query.set("status", params.status.trim());
    if (typeof params.isEmailVerified === "boolean") {
      query.set("isEmailVerified", String(params.isEmailVerified));
    }

    const response = await fetch(
      buildApiUrl(`/api/admin/users?${query.toString()}`, options.baseUrl),
      {
        headers: buildHeaders({ ...options, token }),
        cache: options.cache ?? "no-store",
        signal: options.signal,
      },
    );

    return parseResponseOrThrow<PaginatedResult<User>>(
      response,
      "Error al obtener usuarios del dashboard",
    );
  }, "Error al obtener usuarios del dashboard", options);
};

export const updateAdminUserStatus = async (
  userId: string,
  status: string,
  options: ApiOptions = {},
): Promise<User> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch(
      buildApiUrl("/api/admin/users", options.baseUrl),
      {
        method: "PATCH",
        headers: buildHeaders({ ...options, token }, true),
        body: JSON.stringify({ userId, status }),
        signal: options.signal,
      },
    );

    return parseResponseOrThrow<User>(
      response,
      "Error al actualizar el estado del usuario",
    );
  }, "Error al actualizar el estado del usuario", options);
};

export const updateAdminUserRole = async (
  userId: string,
  role: string,
  options: ApiOptions = {},
): Promise<User> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch(
      buildApiUrl("/api/admin/users", options.baseUrl),
      {
        method: "PATCH",
        headers: buildHeaders({ ...options, token }, true),
        body: JSON.stringify({ userId, role }),
        signal: options.signal,
      },
    );

    return parseResponseOrThrow<User>(
      response,
      "Error al actualizar el rol del usuario",
    );
  }, "Error al actualizar el rol del usuario", options);
};

const requestRefreshSession = async (
  options: ApiOptions = {},
): Promise<RefreshTokenApiResponse> => {
  const response = await fetch(
    buildApiUrl("/api/users/refresh-token", options.baseUrl),
    {
      method: "POST",
      headers: buildHeaders(options, true),
      credentials: "same-origin",
      signal: options.signal,
    },
  );

  return parseResponseOrThrow<RefreshTokenApiResponse>(
    response,
    "Error al refrescar la sesion",
  );
};

export const refreshSession = async (
  options: ApiOptions = {},
): Promise<RefreshTokenApiResponse> => {
  if (options.signal) {
    return requestRefreshSession(options);
  }

  refreshSessionInFlight ??= requestRefreshSession(options).finally(() => {
    refreshSessionInFlight = null;
  });

  return refreshSessionInFlight;
};
