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

const addToMyCartMutation = `
  mutation AddToMyCart($input: AddToCartInput!) {
    addToMyCart(input: $input) {
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

type CartResponseItem = {
  product?: unknown;
  quantity?: number;
  variantName?: string | null;
};

const normalizeCartItems = (items: CartResponseItem[]) =>
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      productId?: string;
      quantity?: number;
      variantName?: string;
    };

    const data = await executeUsersGraphql<
      { addToMyCart: { items: CartResponseItem[] } },
      {
        input: { productId: string; quantity: number; variantName?: string };
      }
    >({
      query: addToMyCartMutation,
      variables: {
        input: {
          productId: String(body.productId ?? ""),
          quantity: Number(body.quantity ?? 0),
          variantName:
            typeof body.variantName === "string" && body.variantName.trim()
              ? body.variantName.trim()
              : undefined,
        },
      },
      request: req,
    });

    return NextResponse.json(normalizeCartItems(data.addToMyCart?.items ?? []));
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
