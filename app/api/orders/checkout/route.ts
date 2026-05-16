import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../../users/graphqlClient";
import { UserApiRouteError } from "../../users/userApi.error";
import { PAYMENTS_ENABLED, paymentsDisabledMessage } from "@/lib/commerceConfig";

const checkoutMutation = `
  mutation CheckoutMyCart($input: CheckoutInput) {
    checkoutMyCart(input: $input) {
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
  if (!PAYMENTS_ENABLED) {
    return NextResponse.json(
      { error: paymentsDisabledMessage },
      { status: 503 },
    );
  }

  try {
    const body = (await req.json().catch(() => null)) as {
      deliveryMethod?: string;
      paymentMethod?: string;
    } | null;
    const deliveryMethod =
      body?.deliveryMethod === "delivery" ? "DELIVERY" : "PICKUP";
    const paymentMethod =
      body?.paymentMethod === "cash" ? "CASH" : "TRANSFER";

    const executeCheckout = (input: Record<string, string>) =>
      executeUsersGraphql<
        {
          checkoutMyCart: Record<string, unknown>;
        },
        { input: Record<string, string> }
      >({
        query: checkoutMutation,
        variables: { input },
        request: req,
      });

    const baseInput = { deliveryMethod };
    const extendedInput = {
      ...baseInput,
      paymentMethod,
    };

    let data: {
      checkoutMyCart: Record<string, unknown>;
    };

    try {
      data = await executeCheckout(extendedInput);
    } catch (error) {
      const message =
        error instanceof Error ? error.message.toLowerCase() : "";
      const canRetryWithoutPaymentIntent =
        message.includes("paymentmethod") ||
        message.includes("unknown field") ||
        message.includes("field") ||
        message.includes("checkoutinput");

      if (!canRetryWithoutPaymentIntent) {
        throw error;
      }

      data = await executeCheckout(baseInput);
    }

    return NextResponse.json(data.checkoutMyCart);
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
