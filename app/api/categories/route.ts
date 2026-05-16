import { NextRequest, NextResponse } from "next/server";
import {
  CategoryApiError,
  categoryFields,
  executeCategoryGraphql,
  readCategoryFromData,
} from "./categoryApi";

const createCategoryMutation = `
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      ${categoryFields}
    }
  }
`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      slug?: string;
      parentId?: string;
      description?: string;
      imageUrl?: string;
      imagePublicId?: string | null;
      isFeatured?: boolean;
      displayOrder?: number;
    };

    const input = {
      name: String(body.name ?? "").trim(),
      slug: String(body.slug ?? "").trim(),
      ...(body.parentId?.trim() ? { parentId: body.parentId.trim() } : {}),
      description: String(body.description ?? "").trim(),
      imageUrl: String(body.imageUrl ?? "").trim(),
      imagePublicId: body.imagePublicId
        ? String(body.imagePublicId).trim()
        : null,
      isFeatured: body.isFeatured === true,
      displayOrder: Number.isFinite(Number(body.displayOrder))
        ? Math.max(0, Math.trunc(Number(body.displayOrder)))
        : 0,
    };

    const data = await executeCategoryGraphql<
      { createCategory: unknown },
      { input: typeof input }
    >({
      query: createCategoryMutation,
      variables: { input },
      request: req,
    });

    return NextResponse.json(readCategoryFromData(data, "createCategory"));
  } catch (error) {
    if (error instanceof CategoryApiError) {
      return NextResponse.json(
        { error: "No se pudo completar la solicitud" },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 },
    );
  }
}
