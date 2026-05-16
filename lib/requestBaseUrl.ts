import { headers } from "next/headers";

const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;

export const getRequestBaseUrl = async (): Promise<string> => {
  const reqHeaders = await headers();
  const host = reqHeaders.get("x-forwarded-host") ?? reqHeaders.get("host");

  if (host) {
    const forwardedProtocol = reqHeaders.get("x-forwarded-proto");
    const protocol =
      forwardedProtocol ?? (LOCAL_HOST_PATTERN.test(host) ? "http" : "https");

    return `${protocol}://${host}`;
  }

  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
};
