import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../graphqlClient";
import { clearAuthCookies } from "../../_utils/security";

const logoutMutation = `
  mutation Logout {
    logout {
      message
    }
  }
`;

export async function POST(req: NextRequest) {
  await executeUsersGraphql<{ logout: { message: string } }>({
    query: logoutMutation,
    request: req,
  }).catch(() => undefined);

  const response = NextResponse.json({ message: "Sesion cerrada" });
  clearAuthCookies(response);
  return response;
}
