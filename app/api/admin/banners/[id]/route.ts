export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getBackendAuthorization } from "../../../_utils/security";

const updateMutation = `
  mutation UpdateBanner($id: String!, $input: UpdateBannerInput!) {
    updateBanner(id: $id, input: $input) {
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

const deleteMutation = `
  mutation DeleteBanner($id: String!) {
    deleteBanner(id: $id) {
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

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const apiUrl = process.env.API_URL?.trim();

  if (!apiUrl) {
    return NextResponse.json({ error: "Falta API_URL" }, { status: 500 });
  }

  try {
    const { id } = await context.params;
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
        query: updateMutation,
        variables: { id, input },
      }),
    });

    const payload = await response.json();

    if (!response.ok || payload.errors) {
      const error = getGraphqlError(
        response,
        payload,
        "Error al actualizar banner",
      );
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(payload.data?.updateBanner);
  } catch {
    return NextResponse.json(
      {
        error:
          "Error al actualizar banner",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const apiUrl = process.env.API_URL?.trim();

  if (!apiUrl) {
    return NextResponse.json({ error: "Falta API_URL" }, { status: 500 });
  }

  try {
    const { id } = await context.params;

    const response = await fetch(`${apiUrl}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getBackendAuthorization(req)
          ? { Authorization: getBackendAuthorization(req) as string }
          : {}),
      },
      body: JSON.stringify({
        query: deleteMutation,
        variables: { id },
      }),
    });

    const payload = await response.json();

    if (!response.ok || payload.errors) {
      const error = getGraphqlError(
        response,
        payload,
        "Error al eliminar banner",
      );
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(payload.data?.deleteBanner);
  } catch {
    return NextResponse.json(
      {
        error:
          "Error al eliminar banner",
      },
      { status: 500 },
    );
  }
}
