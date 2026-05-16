// app/api/products/create/route.ts
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { CreateProductRouteError } from "./createProduct.error";
import { buildCreateProductInput } from "./createProductInput";
import { createProductInBackend } from "./createProductMutation";
import { getBackendAuthorization } from "../../_utils/security";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productInput = buildCreateProductInput(body);
    const product = await createProductInBackend(
      productInput,
      getBackendAuthorization(req),
    );

    return NextResponse.json(product);
  } catch (error: unknown) {
    if (error instanceof CreateProductRouteError) {
      return NextResponse.json(
        { error: error.message || "No se pudo completar la solicitud" },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 },
    );
  }
}
