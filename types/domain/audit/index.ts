export interface AuditLog {
  id: string;
  requestId?: string | null;
  actorUserId?: string | null;
  actorRole?: string | null;
  actorLabel?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogFilters {
  actorUserId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
}
