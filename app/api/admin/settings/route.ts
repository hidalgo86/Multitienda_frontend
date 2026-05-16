export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getBackendAuthorization } from "../../_utils/security";

const settingsSelection = `
  id
  businessName
  legalName
  email
  phone
  address
  city
  state
  country
  logoUrl
  logoPublicId
  extraFields {
    label
    value
  }
  colorPalette {
    preset
    brand50
    brand100
    brand200
    brand300
    brand400
    brand500
    brand600
    brand700
    brand800
    brand900
    brand950
  }
  paymentsEnabled
  checkoutDisabledMessage
  storePickupAddress
  pickupMessage
  deliveryEnabled
  deliveryDisabledMessage
  manualPaymentInstructions
  seoTitle
  seoDescription
  ogImageUrl
  instagramUrl
  aboutTitle
  aboutText
  aboutImageUrl
  createdAt
  updatedAt
`;

const query = `
  query BusinessSettings {
    businessSettings {
      ${settingsSelection}
    }
  }
`;

const mutation = `
  mutation UpdateBusinessSettings($input: UpdateBusinessSettingsInput!) {
    updateBusinessSettings(input: $input) {
      ${settingsSelection}
    }
  }
`;

const isAuthErrorMessage = (message: string): boolean => {
  const normalized = message.trim().toLowerCase();
  return (
    normalized.includes("unauthorized") ||
    normalized.includes("no autenticado") ||
    normalized.includes("debes iniciar sesion") ||
    normalized.includes("token") ||
    normalized.includes("jwt") ||
    normalized.includes("sesion")
  );
};

const getGraphqlError = (
  response: Response,
  payload: {
    errors?: Array<{
      message?: string;
      extensions?: {
        originalError?: {
          message?: string | string[];
        };
      };
    }>;
  },
  fallback: string,
): { message: string; status: number } => {
  const originalMessage =
    payload.errors?.[0]?.extensions?.originalError?.message;
  const message =
    (Array.isArray(originalMessage)
      ? originalMessage.join(", ")
      : originalMessage) ||
    payload.errors?.[0]?.message ||
    fallback;
  const status = response.ok
    ? isAuthErrorMessage(message)
      ? 401
      : 400
    : response.status || 500;

  return { message, status };
};

const graphqlHeaders = (req: NextRequest): HeadersInit => ({
  "Content-Type": "application/json",
  ...(getBackendAuthorization(req)
    ? { Authorization: getBackendAuthorization(req) as string }
    : {}),
});

export async function GET(req: NextRequest) {
  const apiUrl = process.env.API_URL?.trim();

  if (!apiUrl) {
    return NextResponse.json({ error: "Falta API_URL" }, { status: 500 });
  }

  try {
    const response = await fetch(`${apiUrl}/graphql`, {
      method: "POST",
      headers: graphqlHeaders(req),
      body: JSON.stringify({ query }),
      cache: "no-store",
    });
    const payload = await response.json();

    if (!response.ok || payload.errors) {
      const error = getGraphqlError(
        response,
        payload,
        "Error al cargar la configuracion del negocio",
      );
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(payload.data?.businessSettings);
  } catch {
    return NextResponse.json(
      { error: "Error al cargar la configuracion del negocio" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const apiUrl = process.env.API_URL?.trim();

  if (!apiUrl) {
    return NextResponse.json({ error: "Falta API_URL" }, { status: 500 });
  }

  try {
    const input = await req.json();
    const response = await fetch(`${apiUrl}/graphql`, {
      method: "POST",
      headers: graphqlHeaders(req),
      body: JSON.stringify({
        query: mutation,
        variables: { input },
      }),
      cache: "no-store",
    });
    const payload = await response.json();

    if (!response.ok || payload.errors) {
      const error = getGraphqlError(
        response,
        payload,
        "Error al guardar la configuracion del negocio",
      );
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(payload.data?.updateBusinessSettings);
  } catch {
    return NextResponse.json(
      { error: "Error al guardar la configuracion del negocio" },
      { status: 500 },
    );
  }
}
