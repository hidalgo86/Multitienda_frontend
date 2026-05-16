import {
  buildJsonHeaders,
  fetchWithAuthRetry,
  parseResponseOrThrow,
} from "@/lib/apiClient";
import type { AuditLog, AuditLogFilters } from "@/types/domain/audit";
import { type PaginatedResult } from "@/services/users";

interface AuditApiOptions {
  token?: string | null;
  signal?: AbortSignal;
}

interface ListAdminAuditLogsParams extends AuditLogFilters {
  page?: number;
  limit?: number;
}

export const listAdminAuditLogs = async (
  params: ListAdminAuditLogsParams = {},
  options: AuditApiOptions = {},
): Promise<PaginatedResult<AuditLog>> => {
  return fetchWithAuthRetry(async (token) => {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 20));
    if (params.actorUserId?.trim()) {
      query.set("actorUserId", params.actorUserId.trim());
    }
    if (params.action?.trim()) query.set("action", params.action.trim());
    if (params.entityType?.trim()) {
      query.set("entityType", params.entityType.trim());
    }
    if (params.entityId?.trim()) query.set("entityId", params.entityId.trim());

    const response = await fetch(`/api/admin/audit?${query.toString()}`, {
      headers: buildJsonHeaders(token),
      cache: "no-store",
      signal: options.signal,
    });

    return parseResponseOrThrow<PaginatedResult<AuditLog>>(
      response,
      "No se pudieron cargar las auditorias",
    );
  }, "No se pudieron cargar las auditorias", options);
};
