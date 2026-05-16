export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getBackendAuthorization } from "../../_utils/security";

const query = `
  query AdminBanners {
    adminBanners {
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
    }
  }
`;

const mutation = `
  mutation CreateBanner($input: CreateBannerInput!) {
    createBanner(input: $input) {
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
    }
  }
`;

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

const getGraphqlError = (
  response: Response,
  payload: { errors?: Array<{ message?: string }> },
  fallback: string,
): { message: string; status: number } => {
  const message = payload.errors?.[0]?.message || fallback;
  const status = response.ok
    ? isAuthErrorMessage(message)
      ? 401
      : 400
    : response.status || 500;

  return { message, status };
};

export async function GET(req: NextRequest) {
  const apiUrl = process.env.API_URL?.trim();

  if (!apiUrl) {
    return NextResponse.json({ error: "Falta API_URL" }, { status: 500 });
  }

  try {
    const response = await fetch(`${apiUrl}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getBackendAuthorization(req)
          ? { Authorization: getBackendAuthorization(req) as string }
          : {}),
      },
      body: JSON.stringify({ query }),
      cache: "no-store",
    });

    const payload = await response.json();

    if (!response.ok || payload.errors) {
      const error = getGraphqlError(response, payload, "Error al cargar banners");
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(payload.data?.adminBanners ?? []);
  } catch {
    return NextResponse.json(
      {
        error:
          "Error al cargar banners",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const apiUrl = process.env.API_URL?.trim();

  if (!apiUrl) {
    return NextResponse.json({ error: "Falta API_URL" }, { status: 500 });
  }

  try {
    const input = await req.json();

    const response = await fetch(`${apiUrl}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getBackendAuthorization(req)
          ? { Authorization: getBackendAuthorization(req) as string }
          : {}),
      },
      body: JSON.stringify({
        query: mutation,
        variables: { input },
      }),
    });

    const payload = await response.json();

    if (!response.ok || payload.errors) {
      const error = getGraphqlError(response, payload, "Error al crear banner");
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(payload.data?.createBanner);
  } catch {
    return NextResponse.json(
      {
        error: "Error al crear banner",
      },
      { status: 500 },
    );
  }
}
