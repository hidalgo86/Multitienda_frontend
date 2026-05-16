import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../../users/graphqlClient";
import { UserApiRouteError } from "../../users/userApi.error";

const myOrderQuery = `
  query MyOrder($orderId: String!) {
    myOrder(orderId: $orderId) {
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

const myOrderQueryWithoutOrderNumber = myOrderQuery.replace(
  "\n      orderNumber",
  "",
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const orderId = decodeURIComponent(String(id ?? "").trim());

    const executeMyOrder = (query: string) =>
      executeUsersGraphql<
        { myOrder: Record<string, unknown> },
        { orderId: string }
      >({
        query,
        variables: { orderId },
        request: req,
      });

    let data: { myOrder: Record<string, unknown> };

    try {
      data = await executeMyOrder(myOrderQuery);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("orderNumber")) {
        throw error;
      }

      data = await executeMyOrder(myOrderQueryWithoutOrderNumber);
    }

    return NextResponse.json(data.myOrder);
  } catch (error) {
    if (error instanceof UserApiRouteError) {
      return NextResponse.json(
        { error: "No se pudo completar la solicitud" },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
