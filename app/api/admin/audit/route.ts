import { NextRequest, NextResponse } from "next/server";
import { executeUsersGraphql } from "../../users/graphqlClient";
import { UserApiRouteError } from "../../users/userApi.error";
import { clampInteger, jsonError } from "../../_utils/security";

const auditLogsQuery = `
  query AuditLogs($input: GetAuditLogsInput) {
    auditLogs(input: $input) {
      items {
        id
        requestId
        actorUserId
        actorRole
        actorLabel
        action
        entityType
        entityId
        entityLabel
        ip
        metadata
        createdAt
      }
      total
      page
      totalPages
    }
  }
`;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = clampInteger(searchParams.get("page"), 1, 1, 1000);
    const limit = clampInteger(searchParams.get("limit"), 20, 1, 100);
    const actorUserId = searchParams.get("actorUserId")?.trim() || undefined;
    const action = searchParams.get("action")?.trim() || undefined;
    const entityType = searchParams.get("entityType")?.trim() || undefined;
    const entityId = searchParams.get("entityId")?.trim() || undefined;

    const data = await executeUsersGraphql<
      {
        auditLogs: {
          items: Record<string, unknown>[];
          total: number;
          page: number;
          totalPages: number;
        };
      },
      {
        input: {
          actorUserId?: string;
          action?: string;
          entityType?: string;
          entityId?: string;
          page: number;
          limit: number;
        };
      }
    >({
      query: auditLogsQuery,
      variables: {
        input: {
          actorUserId,
          action,
          entityType,
          entityId,
          page,
          limit,
        },
      },
      request: req,
    });

    return NextResponse.json(data.auditLogs);
  } catch (error) {
    if (error instanceof UserApiRouteError) {
      return jsonError(error.status);
    }

    return jsonError(500);
  }
}
