import { NextResponse } from "next/server";
import type { Category } from "@/types/domain/products";

interface GraphqlResponse {
  data?: Record<string, unknown>;
  errors?: Array<{ message?: string }>;
}

const categoryQueries = [
  {
    key: "categories",
    query: `
      query Categories {
        categories {
          id
          name
          slug
        }
      }
    `,
  },
  {
    key: "getCategories",
    query: `
      query GetCategories {
        getCategories {
          id
          name
          slug
        }
      }
    `,
  },
];

const normalizeCategory = (value: unknown): Category | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id =
    typeof record.id === "string"
      ? record.id
      : typeof record._id === "string"
        ? record._id
        : "";
  const name = typeof record.name === "string" ? record.name : "";
  const slug = typeof record.slug === "string" ? record.slug : "";
  const parent = typeof record.parent === "string" ? record.parent : undefined;
  const parentId =
    typeof record.parentId === "string" ? record.parentId : parent;

  if (!id || !name || !slug) return null;

  return { id, name, slug, parent, parentId };
};

const extractCategories = (data?: Record<string, unknown>): Category[] => {
  if (!data) return [];

  const candidates = [
    data.categories,
    data.getCategories,
    typeof data.categories === "object" && data.categories !== null
      ? (data.categories as Record<string, unknown>).items
      : undefined,
    typeof data.getCategories === "object" && data.getCategories !== null
      ? (data.getCategories as Record<string, unknown>).items
      : undefined,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const categories = candidate
      .map(normalizeCategory)
      .filter(Boolean) as Category[];
    if (categories.length > 0) {
      return categories;
    }
  }

  return [];
};

export async function GET() {
  const apiUrl = process.env.API_URL?.trim();

  if (!apiUrl) {
    return NextResponse.json(
      { error: "Falta API_URL en variables de entorno" },
      { status: 500 },
    );
  }

  let lastError = "No se pudieron obtener las categorías";

  for (const candidate of categoryQueries) {
    try {
      const response = await fetch(`${apiUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: candidate.query }),
        cache: "no-store",
      });

      const payload = (await response.json()) as GraphqlResponse;

      if (payload.errors?.length) {
        lastError = payload.errors
          .map((error) => error.message || "Error")
          .join(". ");
        continue;
      }

      const categories = extractCategories(payload.data);
      return NextResponse.json(categories);
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
    }
  }

  return NextResponse.json({ error: lastError }, { status: 500 });
}
