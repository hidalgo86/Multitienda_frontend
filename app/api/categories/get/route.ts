import { NextResponse } from "next/server";
import {
  categoryFields,
  readCategoriesFromData,
} from "../categoryApi";

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
          ${categoryFields}
        }
      }
    `,
  },
  {
    key: "getCategories",
    query: `
      query GetCategories {
        getCategories {
          ${categoryFields}
        }
      }
    `,
  },
];

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

      const categories = readCategoriesFromData(payload.data);
      return NextResponse.json(categories);
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
    }
  }

  return NextResponse.json({ error: lastError }, { status: 500 });
}
