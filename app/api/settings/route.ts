export const runtime = "nodejs";

import { NextResponse } from "next/server";

const query = `
  query BusinessSettings {
    businessSettings {
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
    }
  }
`;

export async function GET() {
  const apiUrl = process.env.API_URL?.trim();

  if (!apiUrl) {
    return NextResponse.json({ error: "Falta API_URL" }, { status: 500 });
  }

  try {
    const response = await fetch(`${apiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      cache: "no-store",
    });
    const payload = await response.json();

    if (!response.ok || payload.errors) {
      return NextResponse.json(
        {
          error:
            payload.errors?.[0]?.message ||
            "Error al cargar la configuracion del negocio",
        },
        { status: response.ok ? 400 : response.status || 500 },
      );
    }

    return NextResponse.json(payload.data?.businessSettings);
  } catch {
    return NextResponse.json(
      { error: "Error al cargar la configuracion del negocio" },
      { status: 500 },
    );
  }
}
