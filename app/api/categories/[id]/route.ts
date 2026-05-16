import { NextRequest, NextResponse } from "next/server";
import {
  CategoryApiError,
  categoryFields,
  executeCategoryGraphql,
  readCategoryFromData,
} from "../categoryApi";

const updateCategoryMutation = `
  mutation UpdateCategory($id: String!, $input: UpdateCategoryInput!) {
    updateCategory(id: $id, input: $input) {
      ${categoryFields}
    }
  }
`;

const deleteCategoryMutation = `
  mutation DeleteCategory($id: String!) {
    deleteCategory(id: $id) {
      ${categoryFields}
    }
  }
`;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      slug?: string;
      parentId?: string | null;
      description?: string;
      imageUrl?: string;
      imagePublicId?: string | null;
      isFeatured?: boolean;
      displayOrder?: number;
    };

    const input = {
      ...(typeof body.name === "string" && body.name.trim()
        ? { name: body.name.trim() }
        : {}),
      ...(typeof body.slug === "string" && body.slug.trim()
        ? { slug: body.slug.trim() }
        : {}),
      ...(typeof body.parentId === "string" && body.parentId.trim()
        ? { parentId: body.parentId.trim() }
        : {}),
      ...(typeof body.description === "string"
        ? { description: body.description.trim() }
        : {}),
      ...(typeof body.imageUrl === "string"
        ? { imageUrl: body.imageUrl.trim() }
        : {}),
      ...(body.imagePublicId !== undefined
        ? {
            imagePublicId:
              typeof body.imagePublicId === "string"
                ? body.imagePublicId.trim()
                : null,
          }
        : {}),
      ...(typeof body.isFeatured === "boolean"
        ? { isFeatured: body.isFeatured }
        : {}),
      ...(Number.isFinite(Number(body.displayOrder))
        ? { displayOrder: Math.max(0, Math.trunc(Number(body.displayOrder))) }
        : {}),
    };

    const data = await executeCategoryGraphql<
      { updateCategory: unknown },
      { id: string; input: typeof input }
    >({
      query: updateCategoryMutation,
      variables: { id, input },
      request: req,
    });

    return NextResponse.json(readCategoryFromData(data, "updateCategory"));
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await executeCategoryGraphql<
      { deleteCategory: unknown },
      { id: string }
    >({
      query: deleteCategoryMutation,
      variables: { id },
      request: req,
    });

    return NextResponse.json(readCategoryFromData(data, "deleteCategory"));
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
