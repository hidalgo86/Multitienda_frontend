import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../graphqlClient";
import { UserApiRouteError } from "../userApi.error";

const safeResetError =
  "No se pudo restablecer la contrasena. Solicita un nuevo enlace e intenta otra vez.";

const resetPasswordMutation = `
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      message
    }
  }
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await executeUsersGraphql<
      { resetPassword: { message: string } },
      { input: { username: string; newPassword: string; token: string } }
    >({
      query: resetPasswordMutation,
      variables: { input: body },
    });

    return NextResponse.json(data.resetPassword);
  } catch (error) {
    if (error instanceof UserApiRouteError) {
      console.warn("[Reset Password]", error.message);
      return NextResponse.json({ error: safeResetError }, { status: 400 });
    }

    return NextResponse.json(
      { error: safeResetError },
      { status: 500 },
    );
  }
}
