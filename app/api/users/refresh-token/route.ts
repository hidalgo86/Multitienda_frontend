import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../graphqlClient";
import { UserApiRouteError } from "../userApi.error";
import {
  REFRESH_COOKIE_NAME,
  clearAuthCookies,
  jsonError,
  setAccessCookie,
  setRefreshCookie,
} from "../../_utils/security";

const COOKIE_SESSION_MARKER = "__cookie_session__";

const refreshTokenMutation = `
  mutation RefreshToken($input: RefreshTokenInput!) {
    refreshToken(input: $input) {
      access_token
      refresh_token
    }
  }
`;

export async function POST(req: NextRequest) {
  try {
    const refreshToken =
      req.cookies.get(REFRESH_COOKIE_NAME)?.value ||
      ((await req.json().catch(() => null)) as { refresh_token?: string } | null)
        ?.refresh_token;

    if (!refreshToken) {
      return jsonError(401);
    }

    const data = await executeUsersGraphql<
      {
        refreshToken: {
          access_token: string;
          refresh_token: string;
        };
      },
      { input: { refresh_token: string } }
    >({
      query: refreshTokenMutation,
      variables: { input: { refresh_token: refreshToken } },
    });

    const { refresh_token, access_token } = data.refreshToken;
    const response = NextResponse.json({ access_token: COOKIE_SESSION_MARKER });

    setAccessCookie(response, access_token);
    setRefreshCookie(response, refresh_token);

    return response;
  } catch (error) {
    const response =
      error instanceof UserApiRouteError
        ? jsonError(error.status)
        : jsonError(500);

    clearAuthCookies(response);
    return response;
  }
}
