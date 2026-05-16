import { NextRequest, NextResponse } from "next/server";
import { normalizeProduct } from "@/app/api/products/normalizeProduct";
import { executeUsersGraphql } from "../users/graphqlClient";
import { UserApiRouteError } from "../users/userApi.error";

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

const myFavoritesQuery = `
  query MyFavorites {
    myFavorites {
      products {
        ${productFields}
      }
    }
  }
`;

const clearFavoritesMutation = `
  mutation ClearMyFavorites {
    clearMyFavorites
  }
`;

export async function GET(req: NextRequest) {
  try {
    const data = await executeUsersGraphql<{
      myFavorites: { products: unknown[] };
    }>({
      query: myFavoritesQuery,
      request: req,
    });

    return NextResponse.json(
      Array.isArray(data.myFavorites?.products)
        ? data.myFavorites.products.map(normalizeProduct)
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

export async function DELETE(req: NextRequest) {
  try {
    const data = await executeUsersGraphql<{ clearMyFavorites: boolean }>({
      query: clearFavoritesMutation,
      request: req,
    });

    return NextResponse.json({ success: Boolean(data.clearMyFavorites) });
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
