import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../../users/graphqlClient";
import { UserApiRouteError } from "../../users/userApi.error";

const submitPaymentProofMutation = `
  mutation SubmitPaymentProof($input: SubmitPaymentProofInput!) {
    submitPaymentProof(input: $input) {
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      orderId?: string;
      paymentReceiptNumber?: string;
      paymentProofUrl?: string;
      paymentProofPublicId?: string;
    };

    const data = await executeUsersGraphql<
      { submitPaymentProof: Record<string, unknown> },
      {
        input: {
          orderId: string;
          paymentReceiptNumber: string;
          paymentProofUrl: string;
          paymentProofPublicId: string;
        };
      }
    >({
      query: submitPaymentProofMutation,
      variables: {
        input: {
          orderId: String(body.orderId ?? ""),
          paymentReceiptNumber: String(body.paymentReceiptNumber ?? ""),
          paymentProofUrl: String(body.paymentProofUrl ?? ""),
          paymentProofPublicId: String(body.paymentProofPublicId ?? ""),
        },
      },
      request: req,
    });

    return NextResponse.json(data.submitPaymentProof);
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
