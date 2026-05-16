"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MdArrowBack, MdWarningAmber } from "react-icons/md";
import {
  adminCancelOrder,
  adminPayOrder,
  adminUnpayOrder,
  listAdminOrders,
  type AdminOrder,
} from "@/services/orders";
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

export default function DashboardOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = useMemo(() => String(params?.id ?? "").trim(), [params]);
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [showPaymentReversal, setShowPaymentReversal] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setError("Orden no valida");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await listAdminOrders({
          orderId,
          page: 1,
          limit: 1,
        });
        const matchedOrder = response.items[0] ?? null;

        if (!matchedOrder) {
          setError("No se encontro la orden solicitada");
          setOrder(null);
          return;
        }

        setOrder(matchedOrder);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar el detalle de la orden",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          Cargando detalle de la orden...
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="space-y-4">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <MdArrowBack size={18} />
          Volver a ordenes
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error || "No se encontro la orden solicitada"}
        </div>
      </section>
    );
  }

  const confirmPayment = async () => {
    if (!order) {
      return;
    }

    setIsUpdating(true);

    try {
      setOrder(await adminPayOrder(order.id));
      toast.success("Pago confirmado");
      setShowPaymentConfirmation(false);
    } catch (actionError) {
      toast.error(getErrorMessage(actionError, "No se pudo confirmar el pago"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmPayment = () => {
    setShowPaymentConfirmation(true);
  };

  const handleCancelOrder = async () => {
    setIsUpdating(true);

    try {
      setOrder(await adminCancelOrder(order.id));
      toast.success("Orden cancelada");
    } catch (actionError) {
      toast.error(getErrorMessage(actionError, "No se pudo cancelar la orden"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnpayOrder = async () => {
    setIsUpdating(true);

    try {
      setOrder(await adminUnpayOrder(order.id));
      toast.success("Pago revertido. La orden vuelve a pendiente.");
      setShowPaymentReversal(false);
    } catch (actionError) {
      toast.error(getErrorMessage(actionError, "No se pudo revertir el pago"));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <section className="space-y-6">
      <ConfirmDialog
        open={showPaymentReversal}
        title="Revertir pago"
        description="La orden volvera a pendiente. No se devolvera stock, pero se descontara esta venta de las estadisticas."
        details={order.orderNumber || order.id}
        confirmLabel="Si, revertir pago"
        cancelLabel="Conservar pagada"
        tone="warning"
        isBusy={isUpdating}
        busyLabel="Revirtiendo..."
        onCancel={() => setShowPaymentReversal(false)}
        onConfirm={() => void handleUnpayOrder()}
      />
      {showPaymentConfirmation && (
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
                  {order.paymentProofUrl
                    ? "Confirmar pago"
                    : "Confirmar pago sin comprobante"}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {order.paymentProofUrl
                    ? "Esta orden tiene comprobante cargado. Confirma el pago solo si ya verificaste que el dinero entro en la cuenta."
                    : "Esta orden no tiene comprobante cargado. Marca como pagada solo si ya verificaste que el dinero entro en la cuenta."}
                </p>
                <p className="mt-3 text-sm font-medium text-slate-900">
                  {order.orderNumber || order.id}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowPaymentConfirmation(false)}
                disabled={isUpdating}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => void confirmPayment()}
                disabled={isUpdating}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {isUpdating ? "Confirmando..." : "Si, confirmar pago"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
      >
        <MdArrowBack size={18} />
        Volver a ordenes
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="break-all text-2xl font-bold text-slate-900">
              {order.orderNumber || order.id}
            </h1>
            <p className="mt-1 break-all text-xs text-slate-400">
              ID interno: {order.id}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {order.user?.name?.trim() || order.user?.username || order.userId}
            </p>
            <p className="text-sm text-slate-500">
              {order.user?.email || "Sin email"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(order.status)}`}
            >
              {formatOrderStatus(order.status)}
            </span>
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {formatPaymentMethod(order)}
            </span>
          </div>
        </div>

        {order.status === "pending" && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isUpdating}
              className="inline-flex justify-center rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
            >
              {isUpdating ? "Procesando..." : "Confirmar pago"}
            </button>
            <button
              type="button"
              onClick={() => void handleCancelOrder()}
              disabled={isUpdating}
              className="inline-flex justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
            >
              {isUpdating ? "Procesando..." : "Cancelar orden"}
            </button>
          </div>
        )}

        {order.status === "pending" && (
          <div
            className={`mt-5 rounded-xl border p-4 text-sm ${
              order.paymentProofUrl || order.paymentReceiptNumber
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            {order.paymentProofUrl || order.paymentReceiptNumber
              ? "Este pedido tiene comprobante cargado y queda pendiente de revision."
              : "Este pedido no tiene comprobante. Si pasan 48 horas desde su creacion, se cancelara automaticamente y liberara stock."}
          </div>
        )}

        {order.status === "paid" && (
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowPaymentReversal(true)}
              disabled={isUpdating}
              className="inline-flex justify-center rounded-lg border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
            >
              {isUpdating ? "Procesando..." : "Revertir pago"}
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Total
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {formatCurrency(order.totalAmount)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Creada
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">
              {formatDate(order.createdAt)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Pagada
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">
              {formatDate(order.paidAt)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Cancelada
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">
              {formatDate(order.cancelledAt)}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Datos del cliente
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-medium text-slate-900">Usuario:</span>{" "}
                {order.user?.username || "Sin usuario"}
              </p>
              <p>
                <span className="font-medium text-slate-900">Nombre:</span>{" "}
                {order.user?.name?.trim() || "No registrado"}
              </p>
              <p>
                <span className="font-medium text-slate-900">Telefono:</span>{" "}
                {order.user?.phone?.trim() || "No registrado"}
              </p>
              <p>
                <span className="font-medium text-slate-900">Rol:</span>{" "}
                {order.user?.role || "Sin rol"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Envio
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-medium text-slate-900">Direccion:</span>{" "}
                {order.shippingAddress.address}
              </p>
              <p>
                <span className="font-medium text-slate-900">Recibe:</span>{" "}
                {order.shippingAddress.name || "Sin nombre"}
              </p>
              <p>
                <span className="font-medium text-slate-900">Telefono:</span>{" "}
                {order.shippingAddress.phone || "Sin telefono"}
              </p>
              <p>
                <span className="font-medium text-slate-900">
                  Referencia de pago:
                </span>{" "}
                {order.paymentReference || "Sin referencia"}
              </p>
              <p>
                <span className="font-medium text-slate-900">
                  Numero de operacion:
                </span>{" "}
                {order.paymentReceiptNumber || "Sin comprobante"}
              </p>
              <p>
                <span className="font-medium text-slate-900">
                  Comprobante:
                </span>{" "}
                {order.paymentProofUrl ? (
                  <a
                    href={order.paymentProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-brand-700 hover:text-brand-800"
                  >
                    Ver imagen
                  </a>
                ) : (
                  "No cargado"
                )}
              </p>
              <p>
                <span className="font-medium text-slate-900">
                  Comprobante enviado:
                </span>{" "}
                {formatDate(order.paymentProofSubmittedAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Productos de la orden
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {order.items.map((item, index) => (
              <div
                key={`${order.id}-${item.productId}-${index}`}
                className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">{item.productName}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Cantidad: {item.quantity}
                    {item.variantName ? ` · Variante: ${item.variantName}` : ""}
                  </p>
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {formatCurrency(item.lineTotal)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
