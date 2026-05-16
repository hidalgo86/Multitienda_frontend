import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../graphqlClient";
import { UserApiRouteError } from "../userApi.error";
import { jsonError } from "../../_utils/security";

const meQuery = `
  query Me {
    me {
      id
      username
      email
      isEmailVerified
      status
      role
      name
      phone
      address
      createdAt
      updatedAt
    }
  }
`;

export async function GET(req: NextRequest) {
  try {
    const data = await executeUsersGraphql<{ me: Record<string, unknown> }>({
      query: meQuery,
      request: req,
    });

    return NextResponse.json(data.me);
  } catch (error) {
    if (error instanceof UserApiRouteError) {
      return jsonError(error.status, "No se pudo completar la solicitud");
    }

    return jsonError(500);
  }
}
