// app/api/products/update/[id]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { UpdateProductRouteError } from "./updateProduct.error";
import { buildUpdateProductInput } from "./updateProductInput";
import {
  deleteProductInBackend,
  restoreProductInBackend,
  updateProductInBackend,
} from "./updateProductMutation";
import { getBackendAuthorization } from "@/app/api/_utils/security";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id)
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const body = await req.json();
    const input = buildUpdateProductInput(body);
    const authorization = getBackendAuthorization(req);
    const product =
      input.state === "ELIMINADO"
        ? await deleteProductInBackend(id, authorization)
        : input.state === "ACTIVO"
          ? await restoreProductInBackend(id, authorization)
          : await updateProductInBackend(id, input, authorization);

    return NextResponse.json(product);
  } catch (error: unknown) {
    if (error instanceof UpdateProductRouteError) {
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
