import { NextRequest, NextResponse } from "next/server";
import { normalizeProduct } from "@/app/api/products/normalizeProduct";
import { executeUsersGraphql } from "../../users/graphqlClient";
import { UserApiRouteError } from "../../users/userApi.error";

const productFields = `
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
`;

const addFavoriteMutation = `
  mutation AddToFavorites($input: AddFavoriteInput!) {
    addToFavorites(input: $input) {
      products {
        ${productFields}
      }
    }
  }
`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { productId?: string };

    const data = await executeUsersGraphql<
      { addToFavorites: { products: unknown[] } },
      { input: { productId: string } }
    >({
      query: addFavoriteMutation,
      variables: { input: { productId: String(body.productId ?? "") } },
      request: req,
    });

    return NextResponse.json(
      Array.isArray(data.addToFavorites?.products)
        ? data.addToFavorites.products.map(normalizeProduct)
        : [],
    );
  } catch (error) {
    if (error instanceof UserApiRouteError) {
      return NextResponse.json({ error: "No se pudo completar la solicitud" }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 },
    );
  }
}
