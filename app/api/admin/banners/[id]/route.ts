export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  BannerApiError,
  bannerFields,
  executeAdminBannerGraphql,
} from "../bannerApi";

const updateMutation = `
  mutation UpdateBanner($id: String!, $input: UpdateBannerInput!) {
    updateBanner(id: $id, input: $input) {
      ${bannerFields}
    }
  }
`;

const deleteMutation = `
  mutation DeleteBanner($id: String!) {
    deleteBanner(id: $id) {
      ${bannerFields}
    }
  }
`;

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const input = await req.json();
    const data = await executeAdminBannerGraphql<
      { updateBanner?: unknown },
      { id: string; input: unknown }
    >({
      req,
      query: updateMutation,
      variables: { id, input },
      fallback: "Error al actualizar banner",
    });

    return NextResponse.json(data.updateBanner);
  } catch (error) {
    if (error instanceof BannerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Error al actualizar banner" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const data = await executeAdminBannerGraphql<
      { deleteBanner?: unknown },
      { id: string }
    >({
      req,
      query: deleteMutation,
      variables: { id },
      fallback: "Error al eliminar banner",
    });

    return NextResponse.json(data.deleteBanner);
  } catch (error) {
    if (error instanceof BannerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Error al eliminar banner" },
      { status: 500 },
    );
  }
}
