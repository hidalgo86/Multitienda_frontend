"use client";

import Link from "next/link";
import Pagination from "@/components/Pagination";
import {
  getStoredAuthToken,
  listAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
  type PaginatedResult,
} from "@/services/users";
import type { User } from "@/types/domain/users";
import { useCallback, useEffect, useState } from "react";
import { MdChevronRight, MdSearch } from "react-icons/md";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorUtils";
import { paginationConfig } from "@/lib/paginationConfig";

const USER_STATUS_OPTIONS = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
  { value: "suspendido", label: "Suspendido" },
  { value: "eliminado", label: "Eliminado" },
];

const USER_ROLE_OPTIONS = [
  { value: "cliente", label: "Cliente" },
  { value: "administrador", label: "Administrador" },
];

const statusBadgeClass = (status: string): string => {
  switch (status) {
    case "activo":
      return "bg-green-100 text-green-700";
    case "inactivo":
      return "bg-gray-100 text-gray-700";
    case "suspendido":
      return "bg-amber-100 text-amber-700";
    case "eliminado":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const normalizeUsersPage = (
  response: Partial<PaginatedResult<User>> | null | undefined,
): PaginatedResult<User> => ({
  items: Array.isArray(response?.items) ? response.items : [],
  total: Number(response?.total) || 0,
  page: Math.max(1, Number(response?.page) || 1),
  totalPages: Math.max(1, Number(response?.totalPages) || 1),
});

export default function DashboardClientsPage() {
  const [usersPage, setUsersPage] = useState<PaginatedResult<User>>({
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const safeItems = Array.isArray(usersPage?.items) ? usersPage.items : [];
  const safeTotalPages = Math.max(1, Number(usersPage?.totalPages) || 1);
  const safeTotal = Number(usersPage?.total) || 0;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!getStoredAuthToken()) {
        setUsersPage(normalizeUsersPage(null));
        return;
      }

      const response = await listAdminUsers({
        page,
        limit: paginationConfig.adminUsersLimit,
        username: debouncedSearch || undefined,
        status: status || undefined,
      });
      setUsersPage(normalizeUsersPage(response));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los clientes",
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, status]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const handleSessionChanged = () => {
      if (!getStoredAuthToken()) {
        setUsersPage(normalizeUsersPage(null));
        setLoading(false);
        setError(null);
      }
    };

    window.addEventListener("auth:session-changed", handleSessionChanged);

    return () => {
      window.removeEventListener("auth:session-changed", handleSessionChanged);
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const handleStatusUpdate = async (userId: string, nextStatus: string) => {
    setUpdatingId(userId);

    try {
      const updatedUser = await updateAdminUserStatus(userId, nextStatus);
      setUsersPage((current) => ({
        ...current,
        items: (Array.isArray(current.items) ? current.items : []).map((user) =>
          user.id === userId ? updatedUser : user,
        ),
      }));
    } catch (updateError) {
      toast.error(
        getErrorMessage(updateError, "No se pudo actualizar el estado del cliente"),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleUpdate = async (userId: string, nextRole: string) => {
    setUpdatingId(userId);

    try {
      const updatedUser = await updateAdminUserRole(userId, nextRole);
      setUsersPage((current) => ({
        ...current,
        items: (Array.isArray(current.items) ? current.items : []).map((user) =>
          user.id === userId ? updatedUser : user,
        ),
      }));
    } catch (updateError) {
      toast.error(
        getErrorMessage(updateError, "No se pudo actualizar el rol del cliente"),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="mt-1 text-sm text-slate-600">
            Revisa usuarios registrados y entra al detalle solo cuando necesites
            ver informacion completa.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            {safeTotal} clientes
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <MdSearch
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                aria-label="Buscar clientes por usuario"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por usuario..."
                className="w-full rounded-xl border border-slate-300 py-2 pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 sm:w-72"
              />
            </div>
            <select
              aria-label="Filtrar clientes por estado"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
            >
              <option value="">Todos los estados</option>
              {USER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Cargando clientes...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          No se pudieron cargar los clientes.
        </div>
      ) : safeItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          No hay clientes para mostrar con esos filtros.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden lg:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Cambiar estado</th>
                    <th className="px-4 py-3">Cambiar rol</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeItems.map((user) => {
                    const isBusy = updatingId === user.id;

                    return (
                      <tr key={user.id} className="text-sm text-slate-700">
                        <td className="px-4 py-4">
                          <Link
                            href={`/dashboard/clients/${encodeURIComponent(user.username)}`}
                            className="font-semibold text-slate-900 transition hover:text-brand-700"
                          >
                            {user.username}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{user.email}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(user.status)}`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{user.role}</td>
                        <td className="px-4 py-4">
                          <select
                            aria-label={`Cambiar estado de ${user.username}`}
                            value={user.status}
                            disabled={isBusy}
                            onChange={(event) =>
                              void handleStatusUpdate(user.id, event.target.value)
                            }
                            className="w-full min-w-[150px] rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:opacity-60"
                          >
                            {USER_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            aria-label={`Cambiar rol de ${user.username}`}
                            value={user.role}
                            disabled={isBusy}
                            onChange={(event) =>
                              void handleRoleUpdate(user.id, event.target.value)
                            }
                            className="w-full min-w-[170px] rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:opacity-60"
                          >
                            {USER_ROLE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Link
                            href={`/dashboard/clients/${encodeURIComponent(user.username)}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-slate-900"
                          >
                            Ver detalle
                            <MdChevronRight size={18} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {safeItems.map((user) => {
                const isBusy = updatingId === user.id;

                return (
                  <article key={user.id} className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/clients/${encodeURIComponent(user.username)}`}
                          className="block truncate font-semibold text-slate-900 transition hover:text-brand-700"
                        >
                          {user.username}
                        </Link>
                        <p className="mt-1 text-sm text-slate-600">{user.email}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(user.status)}`}
                      >
                        {user.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                      <span>{user.role}</span>
                      <Link
                        href={`/dashboard/clients/${encodeURIComponent(user.username)}`}
                        className="inline-flex items-center gap-1 font-medium text-slate-700"
                      >
                        Ver detalle
                        <MdChevronRight size={18} />
                      </Link>
                    </div>

                    <select
                      aria-label={`Cambiar estado de ${user.username}`}
                      value={user.status}
                      disabled={isBusy}
                      onChange={(event) =>
                        void handleStatusUpdate(user.id, event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:opacity-60"
                    >
                      {USER_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label={`Cambiar rol de ${user.username}`}
                      value={user.role}
                      disabled={isBusy}
                      onChange={(event) =>
                        void handleRoleUpdate(user.id, event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:opacity-60"
                    >
                      {USER_ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </article>
                );
              })}
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
