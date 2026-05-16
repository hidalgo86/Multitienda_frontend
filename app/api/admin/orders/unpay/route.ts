import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../../../users/graphqlClient";
import { UserApiRouteError } from "../../../users/userApi.error";

const adminUnpayOrderMutation = `
  mutation AdminUnpayOrder($orderId: String!) {
    adminUnpayOrder(orderId: $orderId) {
      id
      orderNumber
      userId
      user {
        id
        username
        email
        status
        role
        name
        phone
        address
        isEmailVerified
        createdAt
        updatedAt
      }
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { orderId?: string };
    const data = await executeUsersGraphql<
      { adminUnpayOrder: Record<string, unknown> },
      { orderId: string }
    >({
      query: adminUnpayOrderMutation,
      variables: { orderId: String(body.orderId ?? "") },
      request: req,
    });

    return NextResponse.json(data.adminUnpayOrder);
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
