export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  BannerApiError,
  bannerFields,
  executeAdminBannerGraphql,
} from "./bannerApi";

const query = `
  query AdminBanners {
    adminBanners {
      ${bannerFields}
    }
  }
`;

const mutation = `
  mutation CreateBanner($input: CreateBannerInput!) {
    createBanner(input: $input) {
      ${bannerFields}
    }
  }
`;

export async function GET(req: NextRequest) {
  try {
    const data = await executeAdminBannerGraphql<{
      adminBanners?: unknown[];
    }>({
      req,
      query,
      fallback: "Error al cargar banners",
    });

    return NextResponse.json(data.adminBanners ?? []);
  } catch (error) {
    if (error instanceof BannerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Error al cargar banners" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const data = await executeAdminBannerGraphql<
      { createBanner?: unknown },
      { input: unknown }
    >({
      req,
      query: mutation,
      variables: { input },
      fallback: "Error al crear banner",
    });

    return NextResponse.json(data.createBanner);
  } catch (error) {
    if (error instanceof BannerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Error al crear banner" },
      { status: 500 },
    );
  }
}
