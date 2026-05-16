import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../../users/graphqlClient";
import { UserApiRouteError } from "../../users/userApi.error";
import { clampInteger, jsonError } from "../../_utils/security";

const adminOrdersQuery = `
  query AdminOrders($input: OrdersQueryInput) {
    adminOrders(input: $input) {
      items {
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
      total
      page
      totalPages
    }
  }
`;

const toGraphqlOrderStatus = (value?: string): string | undefined => {
  switch (value?.trim().toLowerCase()) {
    case "pending":
      return "PENDING";
    case "paid":
      return "PAID";
    case "cancelled":
      return "CANCELLED";
    default:
      return undefined;
  }
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = clampInteger(searchParams.get("page"), 1, 1, 1000);
    const limit = clampInteger(searchParams.get("limit"), 20, 1, 100);
    const orderId = searchParams.get("orderId")?.trim() || undefined;
    const userId = searchParams.get("userId")?.trim() || undefined;
    const status = toGraphqlOrderStatus(searchParams.get("status") ?? undefined);

    const data = await executeUsersGraphql<
      {
        adminOrders: {
          items: Record<string, unknown>[];
          total: number;
          page: number;
          totalPages: number;
        };
      },
      {
        input: {
          filters: {
            orderId?: string;
            userId?: string;
            status?: string;
          };
          pagination: {
            page: number;
            limit: number;
          };
        };
      }
    >({
      query: adminOrdersQuery,
      variables: {
        input: {
          filters: {
            orderId,
            userId,
            status,
          },
          pagination: {
            page,
            limit,
          },
        },
      },
      request: req,
    });

    return NextResponse.json(data.adminOrders);
  } catch (error) {
    if (error instanceof UserApiRouteError) {
      return jsonError(error.status);
    }

    return jsonError(500);
  }
}
