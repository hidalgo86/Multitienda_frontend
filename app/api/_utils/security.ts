import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const ACCESS_COOKIE_NAME = "access_token";
export const REFRESH_COOKIE_NAME = "refresh_token";

export const ACCESS_COOKIE_MAX_AGE = 15 * 60;
export const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const setAccessCookie = (response: NextResponse, token: string): void => {
  response.cookies.set(ACCESS_COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: ACCESS_COOKIE_MAX_AGE,
  });
};

export const setRefreshCookie = (
  response: NextResponse,
  token: string,
): void => {
  response.cookies.set(REFRESH_COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
};

export const clearAuthCookies = (response: NextResponse): void => {
  response.cookies.delete(ACCESS_COOKIE_NAME);
  response.cookies.delete(REFRESH_COOKIE_NAME);
};

export const getBackendAuthorization = (
  request?: NextRequest,
): string | undefined => {
  const accessToken = request?.cookies.get(ACCESS_COOKIE_NAME)?.value?.trim();
  if (accessToken) return `Bearer ${accessToken}`;

  const header = request?.headers.get("authorization")?.trim();
  return header || undefined;
};

const publicMessages: Record<number, string> = {
  400: "Solicitud no valida",
  401: "Debes iniciar sesion",
  403: "No tienes permisos para realizar esta accion",
  404: "No se encontro el recurso solicitado",
  413: "El archivo es demasiado grande",
  429: "Demasiadas solicitudes. Intenta nuevamente mas tarde",
  500: "Error interno",
  502: "El servicio no esta disponible temporalmente",
  503: "El servicio no esta disponible temporalmente",
};

export const jsonError = (
  status: number,
  fallback = "Error interno",
): NextResponse => {
  const safeStatus = Number.isInteger(status) && status >= 400 ? status : 500;
  return NextResponse.json(
    { error: publicMessages[safeStatus] ?? fallback },
    { status: safeStatus },
  );
};

export const jsonPublicError = (
  status: number,
  fallback = "No se pudo completar la solicitud",
): NextResponse => {
  const safeStatus = Number.isInteger(status) && status >= 400 ? status : 500;
  return NextResponse.json(
    { error: publicMessages[safeStatus] ?? fallback },
    { status: safeStatus },
  );
};

export const clampInteger = (
  value: string | null,
  fallback: number,
  min: number,
  max: number,
): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
};
