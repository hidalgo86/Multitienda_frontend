// app/api/products/get/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  allowedSizes,
  PaginatedProducts,
  ProductsQueryModel,
  ProductSortBy,
  Size,
  parseGenre,
  parseProductAvailability,
  parseProductState,
} from "@/types/domain/products";
import {
  toGraphqlAvailability,
  toGraphqlGenre,
  toGraphqlProductSortBy,
  toGraphqlState,
} from "@/lib/graphqlMappers";
import { normalizeProductsPage } from "../normalizeProduct";
import { clampInteger, getBackendAuthorization } from "../../_utils/security";

export const dynamic = "force-dynamic";

const parseOptionalNumber = (value: string | null): number | undefined => {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseProductSortBy = (value: string | null): ProductSortBy | undefined => {
  if (!value) return undefined;
  return Object.values(ProductSortBy).includes(value as ProductSortBy)
    ? (value as ProductSortBy)
    : undefined;
};

const buildProductsQueryInput = (
  filters: ProductsQueryModel["filters"],
  pagination: ProductsQueryModel["pagination"],
) => {
  return {
    filters: {
      name: filters.name,
      categoryId: filters.categoryId,
      genre: toGraphqlGenre(filters.genre),
      variantNames: filters.variantNames,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      state: toGraphqlState(filters.state),
      availability: toGraphqlAvailability(filters.availability),
      includeDeleted: filters.includeDeleted,
    },
    pagination: {
      ...pagination,
      sortBy: toGraphqlProductSortBy(pagination.sortBy),
    },
  };
};

const query = `
  query Products($input: ProductsQueryInput!) {
    products(input: $input) {
      items {
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
        images {
          url
          publicId
        }
        variants {
          name
          stock
          price
          image
        }
        stock
        price
        stats {
          views
          favorites
          cartAdds
          purchases
          searches
        }
        createdAt
        updatedAt
      }
      total
      page
      totalPages
    }
  }
`;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = clampInteger(searchParams.get("page"), 1, 1, 1000);
    const limit = clampInteger(searchParams.get("limit"), 20, 1, 50);
    const sortBy = parseProductSortBy(searchParams.get("sortBy"));

    const name = searchParams.get("name") || undefined;
    const categoryId = searchParams.get("categoryId")?.trim() || undefined;
    const category = searchParams.get("category")?.trim() || undefined;
    const genre = parseGenre(searchParams.get("genre")) ?? undefined;
    const state = parseProductState(searchParams.get("state")) ?? undefined;
    const availability =
      parseProductAvailability(searchParams.get("availability")) ?? undefined;
    const includeDeleted = searchParams.get("includeDeleted") === "true";
    const sizes = searchParams
      .getAll("size")
      .map((size) => String(size).trim().toUpperCase())
      .filter((size): size is Size => allowedSizes.has(size as Size));
    const variantNames = searchParams
      .getAll("variantName")
      .map((value) => value.trim())
      .filter(Boolean);
    const minPrice = parseOptionalNumber(searchParams.get("minPrice"));
    const maxPrice = parseOptionalNumber(searchParams.get("maxPrice"));
    const resolvedVariantNames = Array.from(
      new Set([...variantNames, ...sizes]),
    );

    const input: ProductsQueryModel = {
      pagination: { page, limit, sortBy },
      filters: {
        name,
        categoryId,
        category,
        genre,
        variantNames: resolvedVariantNames.length
          ? resolvedVariantNames
          : undefined,
        state,
        availability,
        includeDeleted,
        minPrice,
        maxPrice,
      },
    };

    const graphqlInput = buildProductsQueryInput(
      input.filters,
      input.pagination,
    );
    const authorization = getBackendAuthorization(req);

    const backendRes = await fetch(`${process.env.API_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: JSON.stringify({
        query,
        variables: { input: graphqlInput },
      }),
      cache: "no-store",
    });

    const response = await backendRes.json();

    if (response.errors) {
      throw new Error("Error al obtener productos");
    }

    if (!response.data?.products) {
      throw new Error("No se recibieron productos desde GraphQL");
    }

    return NextResponse.json(
      normalizeProductsPage(response.data.products) satisfies PaginatedProducts,
    );
  } catch (error: unknown) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String(
            (error as { message?: unknown }).message ??
              "Error al obtener productos",
          )
        : "Error al obtener productos";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
