import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../graphqlClient";

const safeRecoveryMessage =
  "Si la cuenta existe, enviaremos el usuario al correo indicado.";

const forgotUsernameMutation = `
  mutation ForgotUsername($input: EmailInput!) {
    forgotUsername(input: $input) {
      message
    }
  }
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await executeUsersGraphql<
      { forgotUsername: { message: string } },
      { input: { email: string } }
    >({
      query: forgotUsernameMutation,
      variables: { input: body },
    });

    return NextResponse.json({ message: safeRecoveryMessage });
  } catch (error) {
    console.warn("[Forgot Username]", error);
    return NextResponse.json({ message: safeRecoveryMessage });
  }
}
