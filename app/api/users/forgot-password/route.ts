import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../graphqlClient";

const safeRecoveryMessage =
  "Si la cuenta existe, enviaremos instrucciones al correo indicado.";

const forgotPasswordMutation = `
  mutation ForgotPassword($input: EmailInput!) {
    forgotPassword(input: $input) {
      message
    }
  }
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await executeUsersGraphql<
      { forgotPassword: { message: string } },
      { input: { email: string } }
    >({
      query: forgotPasswordMutation,
      variables: { input: body },
    });

    return NextResponse.json({ message: safeRecoveryMessage });
  } catch (error) {
    console.warn("[Forgot Password]", error);
    return NextResponse.json({ message: safeRecoveryMessage });
  }
}
