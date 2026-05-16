import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../../users/graphqlClient";
import { UserApiRouteError } from "../../users/userApi.error";
import { clampInteger, jsonError } from "../../_utils/security";

const adminUsersQuery = `
  query AdminUsers($input: UsersQueryInput) {
    adminUsers(input: $input) {
      items {
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
      total
      page
      totalPages
    }
  }
`;

const updateUserStatusMutation = `
  mutation UpdateUserStatus($userId: String!, $status: UserStatus!) {
    updateUserStatus(userId: $userId, status: $status) {
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

const updateUserRoleMutation = `
  mutation UpdateUserRole($userId: String!, $role: UserRole!) {
    updateUserRole(userId: $userId, role: $role) {
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

const parseBooleanParam = (value: string | null): boolean | undefined => {
  if (value === null) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return undefined;
};

const toGraphqlUserStatus = (value?: string): string | undefined => {
  switch (value?.trim().toLowerCase()) {
    case "activo":
      return "ACTIVO";
    case "inactivo":
      return "INACTIVO";
    case "suspendido":
      return "SUSPENDIDO";
    case "eliminado":
      return "ELIMINADO";
    default:
      return undefined;
  }
};

const toGraphqlUserRole = (value?: string): string | undefined => {
  switch (value?.trim().toLowerCase()) {
    case "administrador":
      return "ADMINISTRADOR";
    case "cliente":
      return "CLIENTE";
    default:
      return undefined;
  }
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = clampInteger(searchParams.get("page"), 1, 1, 1000);
    const limit = clampInteger(searchParams.get("limit"), 20, 1, 100);
    const username = searchParams.get("username")?.trim() || undefined;
    const email = searchParams.get("email")?.trim() || undefined;
    const role = toGraphqlUserRole(searchParams.get("role") ?? undefined);
    const status = toGraphqlUserStatus(searchParams.get("status") ?? undefined);
    const isEmailVerified = parseBooleanParam(
      searchParams.get("isEmailVerified"),
    );

    const data = await executeUsersGraphql<
      {
        adminUsers: {
          items: Record<string, unknown>[];
          total: number;
          page: number;
          totalPages: number;
        };
      },
      {
        input: {
          filters: {
            username?: string;
            email?: string;
            role?: string;
            status?: string;
            isEmailVerified?: boolean;
          };
          pagination: {
            page: number;
            limit: number;
          };
        };
      }
    >({
      query: adminUsersQuery,
      variables: {
        input: {
          filters: {
            username,
            email,
            role,
            status,
            isEmailVerified,
          },
          pagination: {
            page,
            limit,
          },
        },
      },
      request: req,
    });

    return NextResponse.json(data.adminUsers);
  } catch (error) {
    if (error instanceof UserApiRouteError) {
      return jsonError(error.status);
    }

    return jsonError(500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      userId?: string;
      status?: string;
      role?: string;
    };

    if (body.role) {
      const data = await executeUsersGraphql<
        { updateUserRole: Record<string, unknown> },
        { userId: string; role: string }
      >({
        query: updateUserRoleMutation,
        variables: {
          userId: String(body.userId ?? ""),
          role: toGraphqlUserRole(body.role) ?? "",
        },
        request: req,
      });

      return NextResponse.json(data.updateUserRole);
    }

    const data = await executeUsersGraphql<
      { updateUserStatus: Record<string, unknown> },
      { userId: string; status: string }
    >({
      query: updateUserStatusMutation,
      variables: {
        userId: String(body.userId ?? ""),
        status: toGraphqlUserStatus(body.status) ?? "",
      },
      request: req,
    });

    return NextResponse.json(data.updateUserStatus);
  } catch (error) {
    if (error instanceof UserApiRouteError) {
      return jsonError(error.status);
    }

    return jsonError(500);
  }
}
