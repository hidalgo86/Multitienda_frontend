import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../users/graphqlClient";
import { UserApiRouteError } from "../users/userApi.error";

const myOrdersQuery = `
  query MyOrders {
    myOrders {
      id
      orderNumber
      userId
      items {
        productId
        variantName
        quantity
        productName
        thumbnail
        unitPrice
        lineTotal
      }
      totalAmount
      shippingAddress {
        address
        name
        phone
      }
      deliveryMethod
      status
      paymentMethod
      paymentReference
      paymentReceiptNumber
      paymentProofUrl
      paymentProofPublicId
      paymentProofSubmittedAt
      paidAt
      cancelledAt
      createdAt
      updatedAt
    }
  }
`;

const myOrdersQueryWithoutOrderNumber = myOrdersQuery.replace(
  "\n      orderNumber",
  "",
);

export async function GET(req: NextRequest) {
  try {
    const executeMyOrders = (query: string) =>
      executeUsersGraphql<{
        myOrders: Record<string, unknown>[];
      }>({
        query,
        request: req,
      });

    let data: { myOrders: Record<string, unknown>[] };

    try {
      data = await executeMyOrders(myOrdersQuery);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("orderNumber")) {
        throw error;
      }

      data = await executeMyOrders(myOrdersQueryWithoutOrderNumber);
    }

    return NextResponse.json(Array.isArray(data.myOrders) ? data.myOrders : []);
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
