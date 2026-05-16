import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../graphqlClient";
import { UserApiRouteError } from "../userApi.error";

const changePasswordMutation = `
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      message
    }
  }
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await executeUsersGraphql<
      { changePassword: { message: string } },
      { input: { oldPassword: string; newPassword: string } }
    >({
      query: changePasswordMutation,
      variables: { input: body },
      request: req,
    });

    return NextResponse.json(data.changePassword);
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
