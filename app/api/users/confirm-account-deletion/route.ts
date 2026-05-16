import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies, jsonError } from "../../_utils/security";
import { executeUsersGraphql } from "../graphqlClient";
import { UserApiRouteError } from "../userApi.error";

const confirmAccountDeletionMutation = `
  mutation ConfirmAccountDeletion($input: ConfirmAccountDeletionInput!) {
    confirmAccountDeletion(input: $input) {
      message
    }
  }
`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { code?: unknown }
      | null;
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    const data = await executeUsersGraphql<
      { confirmAccountDeletion: { message: string } },
      { input: { code: string } }
    >({
      query: confirmAccountDeletionMutation,
      variables: { input: { code } },
      request: req,
    });

    const response = NextResponse.json(data.confirmAccountDeletion);
    clearAuthCookies(response);
    return response;
  } catch (error) {
    if (error instanceof UserApiRouteError) {
      return jsonError(error.status);
    }

    return jsonError(500);
  }
}
