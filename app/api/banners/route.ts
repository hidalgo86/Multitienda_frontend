import { NextResponse } from "next/server";
import type { Banner } from "@/types/domain/banners";

interface GraphqlPayload {
  data?: {
    banners?: Banner[];
  };
  errors?: Array<{ message?: string }>;
}

export async function GET() {
  const apiUrl = process.env.API_URL?.trim();

  if (!apiUrl) {
    return NextResponse.json(
      { error: "Falta API_URL en variables de entorno" },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(`${apiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query Banners {
            banners {
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
        `,
      }),
      cache: "no-store",
    });

    const payload = (await response.json()) as GraphqlPayload;

    if (!response.ok || payload.errors?.length) {
      throw new Error(payload.errors?.[0]?.message || "Error al cargar banners");
    }

    return NextResponse.json(payload.data?.banners ?? []);
  } catch {
    return NextResponse.json(
      {
        error: "Error al cargar banners",
      },
      { status: 500 },
    );
  }
}
