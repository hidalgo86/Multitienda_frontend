"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MdArrowBack } from "react-icons/md";
import { listAdminUsers } from "@/services/users";
import type { User } from "@/types/domain/users";

const formatDate = (value?: string | null): string => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function DashboardClientDetailPage() {
  const params = useParams<{ username: string }>();
  const username = useMemo(
    () => decodeURIComponent(String(params?.username ?? "")).trim(),
    [params],
  );
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      if (!username) {
        setError("Usuario no valido");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await listAdminUsers({
          username,
          limit: 20,
          page: 1,
        });

        const matchedUser =
          response.items.find(
            (item) => item.username.toLowerCase() === username.toLowerCase(),
          ) ?? null;

        if (!matchedUser) {
          setError("No se encontro el usuario solicitado");
          setUser(null);
          return;
        }

        setUser(matchedUser);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar el detalle del usuario",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadUser();
  }, [username]);

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          Cargando detalle del usuario...
        </div>
      </section>
    );
  }

  if (error || !user) {
    return (
      <section className="space-y-4">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <MdArrowBack size={18} />
          Volver a clientes
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error || "No se encontro el usuario solicitado"}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
      >
        <MdArrowBack size={18} />
        Volver a clientes
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{user.username}</h1>
            <p className="mt-1 text-sm text-slate-600">{user.email}</p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            {user.role}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Estado
            </div>
            <div className="mt-2 text-base font-semibold text-slate-900">
              {user.status}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Nombre
            </div>
            <div className="mt-2 text-base font-semibold text-slate-900">
              {user.name?.trim() || "No registrado"}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Telefono
            </div>
            <div className="mt-2 text-base font-semibold text-slate-900">
              {user.phone?.trim() || "No registrado"}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Verificacion
            </div>
            <div className="mt-2 text-base font-semibold text-slate-900">
              {user.isEmailVerified ? "Verificado" : "Pendiente"}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Creado
            </div>
            <div className="mt-2 text-base font-semibold text-slate-900">
              {formatDate(user.createdAt)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Actualizado
            </div>
            <div className="mt-2 text-base font-semibold text-slate-900">
              {formatDate(user.updatedAt)}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Direccion
          </div>
          <div className="mt-2 text-sm text-slate-700">
            {user.address?.trim() || "No registrada"}
          </div>
        </div>
      </div>
    </section>
  );
}
