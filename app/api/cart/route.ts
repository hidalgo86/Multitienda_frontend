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

const myCartQuery = `
  query MyCart {
    myCart {
      items {
        productId
        variantName
        quantity
        product {
          ${productFields}
        }
      }
    }
  }
`;

const clearCartMutation = `
  mutation ClearMyCart {
    clearMyCart
  }
`;

const normalizeCartItems = (
  items: Array<{
    product?: unknown;
    quantity?: number;
    variantName?: string | null;
  }>,
) =>
  items
    .map((item) => {
      if (!item.product) return null;

      const product = normalizeProduct(item.product);
      return {
        ...product,
        quantity: Number(item.quantity ?? 0),
        selectedSize: item.variantName?.trim() || undefined,
      };
    })
    .filter(Boolean);

export async function GET(req: NextRequest) {
  try {
    const data = await executeUsersGraphql<{
      myCart: {
        items: Array<{
          product?: unknown;
          quantity?: number;
          variantName?: string | null;
        }>;
      };
    }>({
      query: myCartQuery,
      request: req,
    });

    return NextResponse.json(normalizeCartItems(data.myCart?.items ?? []));
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
    const data = await executeUsersGraphql<{ clearMyCart: boolean }>({
      query: clearCartMutation,
      request: req,
    });

    return NextResponse.json({ success: Boolean(data.clearMyCart) });
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
