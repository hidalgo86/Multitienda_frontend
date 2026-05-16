import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../graphqlClient";
import { UserApiRouteError } from "../userApi.error";
import { jsonError } from "../../_utils/security";

const requestAccountDeletionMutation = `
  mutation RequestAccountDeletion {
    requestAccountDeletion {
      message
    }
  }
`;

export async function POST(req: NextRequest) {
  try {
    const data = await executeUsersGraphql<{
      requestAccountDeletion: { message: string };
    }>({
      query: requestAccountDeletionMutation,
      request: req,
    });

    return NextResponse.json(data.requestAccountDeletion);
  } catch (error) {
    if (error instanceof UserApiRouteError) {
      return jsonError(error.status);
    }

    return jsonError(500);
  }
}
