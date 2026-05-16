import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE_NAME = "access_token";
const REFRESH_COOKIE_NAME = "refresh_token";
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const isProduction = process.env.NODE_ENV === "production";
const NO_STORE_PATH_PREFIXES = [
  "/account",
  "/cart",
  "/checkout",
  "/dashboard",
  "/favorites",
  "/forgot-password",
  "/forgot-username",
  "/login",
  "/orders",
  "/register",
  "/reset-password",
  "/verify",
];

const createNonce = (): string => btoa(crypto.randomUUID());

const buildSecurityHeaders = (nonce?: string): Record<string, string> => ({
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https://res.cloudinary.com",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "style-src-elem 'self' 'unsafe-inline'",
    "style-src-attr 'unsafe-inline'",
    isProduction && nonce
      ? `script-src 'self' 'nonce-${nonce}'`
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "connect-src 'self'",
    "form-action 'self'",
  ].join("; "),
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  ...(isProduction
    ? { "Strict-Transport-Security": "max-age=31536000; includeSubDomains" }
    : {}),
});

const applySecurityHeaders = (
  response: NextResponse,
  nonce?: string,
): NextResponse => {
  for (const [key, value] of Object.entries(buildSecurityHeaders(nonce))) {
    response.headers.set(key, value);
  }

  return response;
};

const shouldDisableCache = (pathname: string): boolean =>
  NO_STORE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

const applyNoStoreHeaders = (response: NextResponse): NextResponse => {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
};

const normalizeOrigin = (value?: string | null): string | null => {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const getExpectedOrigin = (req: NextRequest): string => {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const protocol =
    req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");

  return host ? `${protocol}://${host}` : req.nextUrl.origin;
};

const isAllowedOrigin = (req: NextRequest): boolean => {
  const origin = normalizeOrigin(req.headers.get("origin"));
  const referer = normalizeOrigin(req.headers.get("referer"));
  const expectedOrigin = normalizeOrigin(getExpectedOrigin(req));
  const publicOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  const allowedOrigins = new Set(
    [expectedOrigin, publicOrigin, req.nextUrl.origin].filter(Boolean),
  );

  if (origin) return allowedOrigins.has(origin);
  if (referer) return allowedOrigins.has(referer);

  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "none"].includes(fetchSite)) {
    return false;
  }

  return true;
};

export function proxy(req: NextRequest) {
  const nonce = createNonce();
  const noStore = shouldDisableCache(req.nextUrl.pathname);

  if (
    req.nextUrl.pathname.startsWith("/api/") &&
    MUTATING_METHODS.has(req.method) &&
    !isAllowedOrigin(req)
  ) {
    const response = applySecurityHeaders(
      NextResponse.json({ error: "Origen no permitido" }, { status: 403 }),
    );
    return noStore ? applyNoStoreHeaders(response) : response;
  }

  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");

  const hasSessionCookie =
    req.cookies.get(ACCESS_COOKIE_NAME)?.value ||
    req.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (isDashboard && !hasSessionCookie) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?redirect=${encodeURIComponent(req.nextUrl.pathname)}`;
    return applyNoStoreHeaders(
      applySecurityHeaders(NextResponse.redirect(loginUrl)),
    );
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", buildSecurityHeaders(nonce)["Content-Security-Policy"]);

  const response = applySecurityHeaders(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    }),
    nonce,
  );

  return noStore ? applyNoStoreHeaders(response) : response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)"],
};
