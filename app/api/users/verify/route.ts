import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../graphqlClient";
import { UserApiRouteError } from "../userApi.error";

const verifyEmailMutation = `
  mutation VerifyEmail($input: VerifyEmailInput!) {
    verifyEmail(input: $input) {
      message
    }
  }
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await executeUsersGraphql<
      { verifyEmail: { message: string } },
      { input: { userId: string; code: string } }
    >({
      query: verifyEmailMutation,
      variables: { input: body },
    });

    return NextResponse.json(data.verifyEmail);
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
