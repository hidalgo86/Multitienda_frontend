"use client";

import Link from "next/link";
import Pagination from "@/components/Pagination";
import {
  getStoredAuthToken,
  type PaginatedResult,
} from "@/services/users";
import {
  adminCancelOrder,
  adminPayOrder,
  adminUnpayOrder,
  listAdminOrders,
  type AdminOrder,
} from "@/services/orders";
import { useCallback, useEffect, useState } from "react";
import { MdChevronRight, MdFilterList, MdWarningAmber } from "react-icons/md";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorUtils";
import ConfirmDialog from "@/components/ConfirmDialog";

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);

const formatDate = (value?: string | null): string => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pendientes", countKey: "pending" },
  { value: "paid", label: "Pagadas", countKey: "paid" },
  { value: "cancelled", label: "Canceladas", countKey: "cancelled" },
  { value: "", label: "Todas", countKey: "all" },
] as const;

type OrderCountKey = (typeof ORDER_STATUS_OPTIONS)[number]["countKey"];

const emptyOrderCounts: Record<OrderCountKey, number> = {
  pending: 0,
  paid: 0,
  cancelled: 0,
  all: 0,
};

const statusBadgeClass = (status: string): string => {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-700";
    case "cancelled":
      return "bg-red-50 text-red-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
};

const orderStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagada",
  cancelled: "Cancelada",
};

const paymentMethodLabels: Record<string, string> = {
  manual: "Pago por confirmar",
  manual_paid: "Pago por confirmar",
  cash: "Efectivo",
  transfer: "Transferencia",
  bank_transfer: "Transferencia bancaria",
};

const formatOrderStatus = (status: string): string =>
  orderStatusLabels[status] ?? status;

const formatPaymentMethod = (
  order: Pick<
    AdminOrder,
    "paymentMethod" | "paymentReference" | "paymentProofUrl" | "paymentReceiptNumber"
  >,
): string => {
  if (order.paymentReference === "cash_on_pickup") {
    return "Efectivo al retirar";
  }

  if (
    order.paymentReference === "bank_transfer" ||
    order.paymentProofUrl ||
    order.paymentReceiptNumber
  ) {
    return "Transferencia/deposito";
  }

  return paymentMethodLabels[order.paymentMethod] ?? order.paymentMethod;
};

const paymentReviewLabel = (order: AdminOrder): string => {
  if (order.status !== "pending") {
    return "";
  }

  if (order.paymentProofUrl || order.paymentReceiptNumber) {
    return "Comprobante por revisar";
  }

  return "Sin comprobante: vence a las 48h";
};

const normalizeOrdersPage = (
  response: Partial<PaginatedResult<AdminOrder>> | null | undefined,
): PaginatedResult<AdminOrder> => ({
  items: Array.isArray(response?.items) ? response.items : [],
  total: Number(response?.total) || 0,
  page: Math.max(1, Number(response?.page) || 1),
  totalPages: Math.max(1, Number(response?.totalPages) || 1),
});

export default function DashboardOrdersPage() {
  const [ordersPage, setOrdersPage] = useState<PaginatedResult<AdminOrder>>({
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [paymentConfirmationOrder, setPaymentConfirmationOrder] =
    useState<AdminOrder | null>(null);
  const [paymentReversalOrder, setPaymentReversalOrder] =
    useState<AdminOrder | null>(null);
  const [orderCounts, setOrderCounts] =
    useState<Record<OrderCountKey, number>>(emptyOrderCounts);
  const safeItems = Array.isArray(ordersPage?.items) ? ordersPage.items : [];
  const safeTotalPages = Math.max(1, Number(ordersPage?.totalPages) || 1);
  const safeTotal = Number(ordersPage?.total) || 0;

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!getStoredAuthToken()) {
        setOrdersPage(normalizeOrdersPage(null));
        return;
      }

      const response = await listAdminOrders({
        page,
        limit: 12,
        status: status || undefined,
      });
      setOrdersPage(normalizeOrdersPage(response));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar las ordenes",
      );
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const loadOrderCounts = useCallback(async () => {
    if (!getStoredAuthToken()) {
      setOrderCounts(emptyOrderCounts);
      return;
    }

    try {
      const [pending, paid, cancelled, all] = await Promise.all([
        listAdminOrders({ page: 1, limit: 1, status: "pending" }),
        listAdminOrders({ page: 1, limit: 1, status: "paid" }),
        listAdminOrders({ page: 1, limit: 1, status: "cancelled" }),
        listAdminOrders({ page: 1, limit: 1 }),
      ]);

      setOrderCounts({
        pending: Number(pending.total) || 0,
        paid: Number(paid.total) || 0,
        cancelled: Number(cancelled.total) || 0,
        all: Number(all.total) || 0,
      });
    } catch {
      setOrderCounts(emptyOrderCounts);
    }
  }, []);

  useEffect(() => {
    void loadOrderCounts();
  }, [loadOrderCounts]);

  useEffect(() => {
    const handleSessionChanged = () => {
      if (!getStoredAuthToken()) {
        setOrdersPage(normalizeOrdersPage(null));
        setOrderCounts(emptyOrderCounts);
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
  }, [status]);

  const replaceOrder = (updatedOrder: AdminOrder) => {
    setOrdersPage((current) => ({
      ...current,
      items: (Array.isArray(current.items) ? current.items : [])
        .map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
        .filter((order) => !status || order.status === status),
      total:
        status && updatedOrder.status !== status
          ? Math.max(0, Number(current.total || 0) - 1)
          : current.total,
    }));
  };

  const confirmPayOrder = async (order: AdminOrder) => {
    const orderId = order.id;
    setActiveOrderId(orderId);

    try {
      replaceOrder(await adminPayOrder(orderId));
      void loadOrderCounts();
      toast.success("Orden marcada como pagada");
      setPaymentConfirmationOrder(null);
    } catch (actionError) {
      toast.error(
        getErrorMessage(actionError, "No se pudo marcar la orden como pagada"),
      );
    } finally {
      setActiveOrderId(null);
    }
  };

  const handlePay = (order: AdminOrder) => {
    setPaymentConfirmationOrder(order);
  };

  const handleCancel = async (orderId: string) => {
    setActiveOrderId(orderId);

    try {
      replaceOrder(await adminCancelOrder(orderId));
      void loadOrderCounts();
    } catch (actionError) {
      toast.error(getErrorMessage(actionError, "No se pudo cancelar la orden"));
    } finally {
      setActiveOrderId(null);
    }
  };

  const handleUnpay = async (order: AdminOrder) => {
    setActiveOrderId(order.id);

    try {
      replaceOrder(await adminUnpayOrder(order.id));
      void loadOrderCounts();
      toast.success("Pago revertido. La orden vuelve a pendiente.");
      setPaymentReversalOrder(null);
    } catch (actionError) {
      toast.error(getErrorMessage(actionError, "No se pudo revertir el pago"));
    } finally {
      setActiveOrderId(null);
    }
  };

  return (
    <section className="space-y-6">
      <ConfirmDialog
        open={Boolean(paymentReversalOrder)}
        title="Revertir pago"
        description="La orden volvera a pendiente. No se devolvera stock, pero se descontara esta venta de las estadisticas."
        details={
          paymentReversalOrder
            ? paymentReversalOrder.orderNumber || paymentReversalOrder.id
            : undefined
        }
        confirmLabel="Si, revertir pago"
        cancelLabel="Conservar pagada"
        tone="warning"
        isBusy={Boolean(
          paymentReversalOrder && activeOrderId === paymentReversalOrder.id,
        )}
        busyLabel="Revirtiendo..."
        onCancel={() => setPaymentReversalOrder(null)}
        onConfirm={() => {
          if (!paymentReversalOrder) return;
          void handleUnpay(paymentReversalOrder);
        }}
      />
      {paymentConfirmationOrder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-confirmation-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                <MdWarningAmber size={24} />
              </div>
              <div>
                <h2
                  id="payment-confirmation-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  {paymentConfirmationOrder.paymentProofUrl
                    ? "Confirmar pago"
                    : "Confirmar pago sin comprobante"}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {paymentConfirmationOrder.paymentProofUrl
                    ? "Esta orden tiene comprobante cargado. Confirma el pago solo si ya verificaste que el dinero entro en la cuenta."
                    : "Esta orden no tiene comprobante cargado. Marca como pagada solo si ya verificaste que el dinero entro en la cuenta."}
                </p>
                <p className="mt-3 text-sm font-medium text-slate-900">
                  {paymentConfirmationOrder.orderNumber ||
                    paymentConfirmationOrder.id}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPaymentConfirmationOrder(null)}
                disabled={activeOrderId === paymentConfirmationOrder.id}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => void confirmPayOrder(paymentConfirmationOrder)}
                disabled={activeOrderId === paymentConfirmationOrder.id}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {activeOrderId === paymentConfirmationOrder.id
                  ? "Confirmando..."
                  : "Si, confirmar pago"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ordenes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Los pedidos pendientes sin comprobante se cancelan automaticamente
            despues de 48 horas y liberan stock.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              {safeTotal} ordenes en este filtro
            </div>

            <button
              type="button"
              onClick={() => {
                void loadOrders();
                void loadOrderCounts();
              }}
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            >
              Actualizar
            </button>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
              <MdFilterList size={18} />
              Filtrar por estado
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {ORDER_STATUS_OPTIONS.map((option) => (
                <button
                  key={option.countKey}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    status === option.value
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {option.label} ({orderCounts[option.countKey]})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Cargando ordenes...
        </div>
      ) : safeItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          No hay ordenes para mostrar.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-[1120px] divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Orden</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Pago</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Creada</th>
                    <th className="px-4 py-3">Acciones</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeItems.map((order) => {
                    const isBusy = activeOrderId === order.id;
                    const isPending = order.status === "pending";

                    return (
                      <tr key={order.id} className="text-sm text-slate-700">
                        <td className="px-4 py-4">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="line-clamp-1 font-semibold text-slate-900 transition hover:text-brand-700"
                          >
                            {order.orderNumber || order.id}
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          <div className="min-w-[220px]">
                            <div className="font-medium text-slate-900">
                              {order.user?.name?.trim() ||
                                order.user?.username ||
                                order.userId}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {order.user?.email || "Sin email"}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(order.status)}`}
                          >
                            {formatOrderStatus(order.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          <div>{formatPaymentMethod(order)}</div>
                          {order.paymentProofUrl ? (
                            <a
                              href={order.paymentProofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex text-xs font-medium text-brand-700 hover:text-brand-800"
                            >
                              Ver comprobante
                            </a>
                          ) : (
                            <div className="mt-1 text-xs text-slate-400">
                              Sin comprobante
                            </div>
                          )}
                          {paymentReviewLabel(order) && (
                            <div
                              className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                order.paymentProofUrl ||
                                order.paymentReceiptNumber
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {paymentReviewLabel(order)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-900">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {isPending ? (
                              <>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void handlePay(order)}
                                  className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
                                >
                                  {isBusy ? "Procesando..." : "Marcar pagada"}
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void handleCancel(order.id)}
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                                >
                                  {isBusy ? "Procesando..." : "Cancelar"}
                                </button>
                              </>
                            ) : order.status === "paid" ? (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => setPaymentReversalOrder(order)}
                                className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
                              >
                                {isBusy ? "Procesando..." : "Revertir pago"}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Sin acciones
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
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
              {safeItems.map((order) => {
                const isBusy = activeOrderId === order.id;
                const isPending = order.status === "pending";

                return (
                  <article key={order.id} className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="block truncate font-semibold text-slate-900 transition hover:text-brand-700"
                        >
                          {order.orderNumber || order.id}
                        </Link>
                        <p className="mt-1 text-sm text-slate-600">
                          {order.user?.name?.trim() ||
                            order.user?.username ||
                            order.userId}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.user?.email || "Sin email"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(order.status)}`}
                      >
                        {formatOrderStatus(order.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Pago
                        </p>
                        <p className="mt-1">
                          {formatPaymentMethod(order)}
                        </p>
                        {order.paymentProofUrl ? (
                          <a
                            href={order.paymentProofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex text-xs font-medium text-brand-700"
                          >
                            Ver comprobante
                          </a>
                        ) : (
                          <p className="mt-1 text-xs text-slate-400">
                            Sin comprobante
                          </p>
                        )}
                        {paymentReviewLabel(order) && (
                          <p
                            className={`mt-2 rounded-md px-2 py-1 text-xs font-medium ${
                              order.paymentProofUrl ||
                              order.paymentReceiptNumber
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {paymentReviewLabel(order)}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Total
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatCurrency(order.totalAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-slate-700"
                      >
                        Ver detalle
                        <MdChevronRight size={18} />
                      </Link>

                      {isPending ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handlePay(order)}
                            className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
                          >
                            {isBusy ? "Procesando..." : "Pagada"}
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleCancel(order.id)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                          >
                            {isBusy ? "Procesando..." : "Cancelar"}
                          </button>
                        </div>
                      ) : order.status === "paid" ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setPaymentReversalOrder(order)}
                          className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
                        >
                          {isBusy ? "Procesando..." : "Revertir pago"}
                        </button>
                      ) : null}
                    </div>
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
