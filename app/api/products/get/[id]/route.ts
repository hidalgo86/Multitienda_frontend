// app/api/products/get/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { ProductByIdQueryResponse } from "@/types/api/products/graphql";
import { normalizeProduct } from "../../normalizeProduct";
import { getBackendAuthorization } from "../../../_utils/security";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const query = `
    query Product($id: String!, $trackView: Boolean) {
      product(id: $id, trackView: $trackView) {
        id
        sku
        slug
        categoryId
        name
        description
        brand
        thumbnail
        genre
        state
        availability
        variants { name stock price image }
        images { url publicId }
        stock
        price
        stats { views favorites cartAdds purchases searches }
        createdAt
        updatedAt
      }
    }
  `;

  try {
    const authorization = getBackendAuthorization(req);
    const { searchParams } = new URL(req.url);
    const trackView = searchParams.get("trackView") !== "false";
    const res = await fetch(`${process.env.API_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: JSON.stringify({ query, variables: { id, trackView } }),
    });

    const data = (await res.json()) as ProductByIdQueryResponse;

    if (data.errors?.length) {
      const message = data.errors.map((e) => e.message || "Error").join(", ");
      return NextResponse.json({ error: message }, { status: 500 });
    }

    if (!data.data?.product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(normalizeProduct(data.data.product));
  } catch {
    return NextResponse.json(
      {
        error: "Error interno",
      },
      { status: 500 },
    );
  }
}
