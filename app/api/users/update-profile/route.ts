import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../graphqlClient";
import { UserApiRouteError } from "../userApi.error";

const updateMyProfileMutation = `
  mutation UpdateMyProfile($input: UpdateProfileInput!) {
    updateMyProfile(input: $input) {
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

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await executeUsersGraphql<
      { updateMyProfile: Record<string, unknown> },
      { input: { name?: string; phone?: string; address?: string } }
    >({
      query: updateMyProfileMutation,
      variables: { input: body },
      request: req,
    });

    return NextResponse.json(data.updateMyProfile);
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
