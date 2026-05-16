"use client";

import Pagination from "@/components/Pagination";
import { listAdminAuditLogs } from "@/services/audit";
import {
  getStoredAuthToken,
  type PaginatedResult,
} from "@/services/users";
import type { AuditLog, AuditLogFilters } from "@/types/domain/audit";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { MdRefresh, MdSearch } from "react-icons/md";
import { paginationConfig } from "@/lib/paginationConfig";

const INITIAL_FILTERS: AuditLogFilters = {
  actorUserId: "",
  action: "",
  entityType: "",
  entityId: "",
};

const formatDate = (value?: string | null): string => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const normalizeAuditPage = (
  response: Partial<PaginatedResult<AuditLog>> | null | undefined,
): PaginatedResult<AuditLog> => ({
  items: Array.isArray(response?.items) ? response.items : [],
  total: Number(response?.total) || 0,
  page: Math.max(1, Number(response?.page) || 1),
  totalPages: Math.max(1, Number(response?.totalPages) || 1),
});

const compactId = (value?: string | null): string => {
  if (!value) return "-";
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
};

const shouldShowEntityId = (log: AuditLog): boolean => {
  if (!log.entityId) return false;
  return log.entityId !== log.actorUserId;
};

const entityLabel = (log: AuditLog): string => {
  return log.entityLabel?.trim() || moduleLabel(log);
};

const entityContextLabel = (log: AuditLog): string | null => {
  const context = moduleLabel(log);
  const label = log.entityLabel?.trim();
  return label && context !== label ? context : null;
};

const actorRoleLabel = (log: AuditLog): string | null => {
  if (log.actorRole) return log.actorRole;
  if (log.actorLabel?.trim()) return null;
  return log.actorUserId ? null : "Sin autenticar";
};

const actorLabel = (log: AuditLog): string => {
  return log.actorLabel?.trim() || compactId(log.actorUserId);
};

const ipLabel = (value?: string | null): string => {
  if (!value) return "Sin IP";

  const normalizedValue = value.trim();
  if (
    normalizedValue === "::1" ||
    normalizedValue === "0:0:0:0:0:0:0:1" ||
    normalizedValue === "0:0:0::" ||
    normalizedValue === "127.0.0.1"
  ) {
    return "Local";
  }

  return normalizedValue;
};

const actionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    login_success: "Inicio de sesion",
    login_failed: "Intento fallido",
    logout: "Cierre de sesion",
    user_created: "Cuenta creada",
    password_changed: "Cambio de contrasena",
    user_role_changed: "Cambio de rol",
    user_status_changed: "Cambio de estado",
    order_created: "Pedido creado",
    order_paid: "Pedido pagado",
    order_payment_reverted: "Pago revertido",
    order_cancelled: "Pedido cancelado",
    product_created: "Producto creado",
    product_updated: "Producto actualizado",
    product_price_changed: "Precio modificado",
    product_stock_changed: "Stock modificado",
    login: "Inicio de sesion",
    refreshToken: "Renovacion de sesion",
    register: "Registro",
    updateMyProfile: "Actualizacion de perfil",
    updateUserStatus: "Cambio de estado",
    changePassword: "Cambio de contrasena",
    requestAccountDeletion: "Solicitud de borrado",
    confirmAccountDeletion: "Borrado de cuenta",
    checkoutMyCart: "Compra",
    payMyOrder: "Pago de pedido",
    adminPayOrder: "Pago admin",
    adminUnpayOrder: "Reversion de pago",
    cancelMyOrder: "Cancelacion de pedido",
    adminCancelOrder: "Cancelacion admin",
    createProduct: "Producto creado",
    updateProduct: "Producto actualizado",
    deleteProduct: "Producto eliminado",
    restoreProduct: "Producto restaurado",
    createCategory: "Categoria creada",
    updateCategory: "Categoria actualizada",
    deleteCategory: "Categoria eliminada",
    createBanner: "Banner creado",
    updateBanner: "Banner actualizado",
    deleteBanner: "Banner eliminado",
  };

  return labels[action] ?? action;
};

const moduleLabel = (log: AuditLog): string => {
  const modules: Record<string, string> = {
    login_success: "Autenticacion",
    login_failed: "Autenticacion",
    logout: "Autenticacion",
    user_created: "Usuarios",
    password_changed: "Usuarios",
    user_role_changed: "Usuarios",
    user_status_changed: "Usuarios",
    order_created: "Pedidos",
    order_paid: "Pedidos",
    order_payment_reverted: "Pedidos",
    order_cancelled: "Pedidos",
    product_created: "Productos",
    product_updated: "Productos",
    product_price_changed: "Productos",
    product_stock_changed: "Productos",
    login: "Autenticacion",
    refreshToken: "Autenticacion",
    register: "Usuarios",
    updateUserStatus: "Usuarios",
    updateMyProfile: "Cuenta",
    changePassword: "Cuenta",
    requestAccountDeletion: "Cuenta",
    confirmAccountDeletion: "Cuenta",
    checkoutMyCart: "Pedidos",
    payMyOrder: "Pedidos",
    adminPayOrder: "Pedidos",
    adminUnpayOrder: "Pedidos",
    cancelMyOrder: "Pedidos",
    adminCancelOrder: "Pedidos",
    User: "Usuarios",
    Order: "Pedidos",
    Product: "Productos",
    Auth: "Autenticacion",
    Category: "Categorias",
    Banner: "Banners",
  };

  return modules[log.entityType] ?? modules[log.action] ?? (log.entityType || "-");
};

const fieldLabel = (field: string): string => {
  const labels: Record<string, string> = {
    name: "nombre",
    categoryId: "categoria",
    description: "descripcion",
    brand: "marca",
    thumbnail: "imagen principal",
    genre: "genero",
    images: "imagenes",
    variants: "variantes",
    stock: "stock",
    price: "precio",
    state: "estado",
  };

  return labels[field] ?? field;
};

const formatAuditValue = (value: unknown): string => {
  if (value === null || value === undefined) return "vacio";
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "string") return value || "vacio";

  if (typeof value === "object" && "count" in value) {
    const count = Number((value as { count?: unknown }).count);
    return Number.isFinite(count) ? `${count}` : "varios";
  }

  return "modificado";
};

const formatFieldChange = (
  field: string,
  change: unknown,
): string => {
  if (!change || typeof change !== "object") return fieldLabel(field);

  const record = change as { before?: unknown; after?: unknown };
  return `${fieldLabel(field)}: ${formatAuditValue(record.before)} -> ${formatAuditValue(record.after)}`;
};

const auditDetails = (log: AuditLog): string | null => {
  const changedFields = log.metadata?.changedFields;
  const changes =
    log.metadata?.changes && typeof log.metadata.changes === "object"
      ? (log.metadata.changes as Record<string, unknown>)
      : null;

  if (!Array.isArray(changedFields) || changedFields.length === 0) {
    return null;
  }

  const fields = changedFields
    .filter((field): field is string => typeof field === "string")
    .map((field) =>
      changes?.[field] ? formatFieldChange(field, changes[field]) : fieldLabel(field),
    );

  return fields.length ? `Cambios: ${fields.join(", ")}` : null;
};

const badgeClass = (action: string): string => {
  const normalizedAction = action.toLowerCase();

  if (normalizedAction.includes("delete") || normalizedAction.includes("cancel")) {
    return "bg-red-50 text-red-700";
  }

  if (normalizedAction.includes("failed")) {
    return "bg-red-50 text-red-700";
  }

  if (normalizedAction.includes("create") || normalizedAction.includes("register")) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    normalizedAction.includes("update") ||
    normalizedAction.includes("pay") ||
    normalizedAction.includes("paid") ||
    normalizedAction.includes("changed")
  ) {
    return "bg-brand-50 text-brand-700";
  }

  if (
    normalizedAction.includes("login") ||
    normalizedAction.includes("logout") ||
    normalizedAction.includes("token")
  ) {
    return "bg-violet-50 text-violet-700";
  }

  return "bg-slate-100 text-slate-700";
};

export default function DashboardAuditPage() {
  const [auditPage, setAuditPage] = useState<PaginatedResult<AuditLog>>({
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<AuditLogFilters>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<AuditLogFilters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const safeItems = Array.isArray(auditPage.items) ? auditPage.items : [];
  const safeTotalPages = Math.max(1, Number(auditPage.totalPages) || 1);
  const safeTotal = Number(auditPage.total) || 0;

  const hasFilters = useMemo(
    () =>
      Object.values(appliedFilters).some(
        (value) => typeof value === "string" && value.trim(),
      ),
    [appliedFilters],
  );

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!getStoredAuthToken()) {
        setAuditPage(normalizeAuditPage(null));
        return;
      }

      const response = await listAdminAuditLogs({
        ...appliedFilters,
        page,
        limit: paginationConfig.adminAuditLimit,
      });
      setAuditPage(normalizeAuditPage(response));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar las auditorias",
      );
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    void loadAuditLogs();
  }, [loadAuditLogs]);

  useEffect(() => {
    const handleSessionChanged = () => {
      if (!getStoredAuthToken()) {
        setAuditPage(normalizeAuditPage(null));
        setLoading(false);
        setError(null);
      }
    };

    window.addEventListener("auth:session-changed", handleSessionChanged);

    return () => {
      window.removeEventListener("auth:session-changed", handleSessionChanged);
    };
  }, []);

  const updateFilter = (key: keyof AuditLogFilters, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
  };

  const handleClear = () => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setPage(1);
  };

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Auditorias</h1>
            <p className="mt-1 text-sm text-slate-500">
              Bitacora basica de seguridad, pedidos y cambios de administracion.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadAuditLogs()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            disabled={loading}
          >
            <MdRefresh size={18} />
            Actualizar
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1 text-sm font-medium text-slate-700">
              Usuario
              <input
                value={filters.actorUserId ?? ""}
                onChange={(event) => updateFilter("actorUserId", event.target.value)}
                placeholder="ID de usuario"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none transition focus:border-slate-500"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">
              Accion
              <input
                value={filters.action ?? ""}
                onChange={(event) => updateFilter("action", event.target.value)}
                placeholder="login_success, order_paid..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none transition focus:border-slate-500"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">
              Tipo
              <input
                value={filters.entityType ?? ""}
                onChange={(event) => updateFilter("entityType", event.target.value)}
                placeholder="Product, Order, User..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none transition focus:border-slate-500"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">
              ID entidad
              <input
                value={filters.entityId ?? ""}
                onChange={(event) => updateFilter("entityId", event.target.value)}
                placeholder="ID afectado"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none transition focus:border-slate-500"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              {safeTotal} registros
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleClear}
                disabled={!hasFilters && !Object.values(filters).some(Boolean)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Limpiar
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <MdSearch size={18} />
                Buscar
              </button>
            </div>
          </div>
        </form>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Cargando auditorias...
        </div>
      ) : safeItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          No hay auditorias para mostrar.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden xl:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Accion</th>
                    <th className="px-4 py-3">Afectado</th>
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeItems.map((log) => (
                    <tr key={log.id} className="text-sm text-slate-700">
                      <td className="px-4 py-4 text-slate-600">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(log.action)}`}
                        >
                          {actionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">
                          {entityLabel(log)}
                        </div>
                        {entityContextLabel(log) && (
                          <div className="mt-1 text-xs text-slate-500">
                            {entityContextLabel(log)}
                          </div>
                        )}
                        {shouldShowEntityId(log) && (
                          <div className="mt-1 font-mono text-xs text-slate-500">
                            {compactId(log.entityId)}
                          </div>
                        )}
                        {auditDetails(log) && (
                          <div className="mt-2 text-xs font-medium text-slate-600">
                            {auditDetails(log)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">
                          {actorLabel(log)}
                        </div>
                        {actorRoleLabel(log) && (
                          <div className="mt-1 text-xs text-slate-500">
                            {actorRoleLabel(log)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {ipLabel(log.ip)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 xl:hidden">
              {safeItems.map((log) => (
                <article key={log.id} className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">
                        {entityLabel(log)}
                      </p>
                      {entityContextLabel(log) && (
                        <p className="mt-1 text-xs text-slate-500">
                          {entityContextLabel(log)}
                        </p>
                      )}
                      {shouldShowEntityId(log) && (
                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {compactId(log.entityId)}
                        </p>
                      )}
                      {auditDetails(log) && (
                        <p className="mt-2 text-xs font-medium text-slate-600">
                          {auditDetails(log)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(log.action)}`}
                    >
                      {actionLabel(log.action)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Fecha
                      </p>
                      <p className="mt-1">{formatDate(log.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Usuario
                      </p>
                      <p className="mt-1 font-medium text-slate-800">
                        {actorLabel(log)}
                      </p>
                      {actorRoleLabel(log) && (
                        <p className="mt-1 text-xs text-slate-500">
                          {actorRoleLabel(log)}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        IP
                      </p>
                      <p className="mt-1">{ipLabel(log.ip)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <Pagination
            currentPage={page}
            totalPages={safeTotalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}
