import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../graphqlClient";
import { UserApiRouteError } from "../userApi.error";
import { jsonError, setAccessCookie, setRefreshCookie } from "../../_utils/security";

const COOKIE_SESSION_MARKER = "__cookie_session__";

const loginMutation = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      access_token
      refresh_token
      user {
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
  }
`;

const mapLoginError = (message: string): { message: string; status: number } => {
  const normalized = message.trim().toLowerCase();

  if (
    normalized.includes("bloqueado") ||
    normalized.includes("suspendido") ||
    normalized.includes("demasiados intentos")
  ) {
    return {
      message:
        "Usuario bloqueado por demasiados intentos fallidos. Contacta con administracion.",
      status: 423,
    };
  }

  if (
    normalized.includes("credenciales") ||
    normalized.includes("usuario o contrasena") ||
    normalized.includes("usuario o contraseña") ||
    normalized.includes("invalid credentials") ||
    normalized.includes("unauthorized")
  ) {
    return {
      message: "Usuario o contrasena incorrectos.",
      status: 401,
    };
  }

  if (
    normalized.includes("unknown type") ||
    normalized.includes("cannot query field") ||
    normalized.includes("syntax error") ||
    normalized.includes("graphql")
  ) {
    return {
      message: "El inicio de sesion no esta disponible temporalmente.",
      status: 502,
    };
  }

  return {
    message: "No se pudo iniciar sesion. Intenta nuevamente.",
    status: 400,
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await executeUsersGraphql<
      {
        login: {
          access_token: string;
          refresh_token: string;
          user: Record<string, unknown>;
        };
      },
      { input: { username: string; password: string } }
    >({
      query: loginMutation,
      variables: { input: body },
    });

    const { refresh_token, ...session } = data.login;
    const response = NextResponse.json({
      ...session,
      access_token: COOKIE_SESSION_MARKER,
    });

    setAccessCookie(response, session.access_token);
    setRefreshCookie(response, refresh_token);

    return response;
  } catch (error) {
    if (error instanceof UserApiRouteError) {
      const mappedError = mapLoginError(error.message);
      return NextResponse.json({ error: mappedError.message }, { status: mappedError.status });
    }

    return jsonError(500, "No se pudo iniciar sesion. Intenta nuevamente.");
  }
}
