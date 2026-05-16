import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../graphqlClient";
import { UserApiRouteError } from "../userApi.error";

const safeResendError =
  "No se pudo reenviar el codigo. Intenta nuevamente mas tarde.";

const meQuery = `
  query Me {
    me {
      id
    }
  }
`;

const resendVerificationMutation = `
  mutation ResendVerification($input: ResendVerificationInput!) {
    resendVerification(input: $input) {
      message
    }
  }
`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { userId?: string };
    let userId = body.userId?.trim() || "";

    const authorization = req.headers.get("authorization");
    if (authorization) {
      try {
        const meData = await executeUsersGraphql<{ me: { id: string } }>({
          query: meQuery,
          request: req,
        });

        userId = meData.me?.id?.trim() || userId;
      } catch {
        // Si no se puede resolver por sesion, usamos el body como fallback.
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "No se pudo resolver el usuario para reenviar el codigo" },
        { status: 400 },
      );
    }

    const data = await executeUsersGraphql<
      { resendVerification: { message: string } },
      { input: { userId: string } }
    >({
      query: resendVerificationMutation,
      variables: { input: { userId } },
      request: req,
    });

    return NextResponse.json(data.resendVerification);
  } catch (error) {
    if (error instanceof UserApiRouteError) {
      console.warn("[Resend Verification]", error.message);
      return NextResponse.json({ error: safeResendError }, { status: error.status });
    }

    return NextResponse.json(
      { error: safeResendError },
      { status: 500 },
    );
  }
}
