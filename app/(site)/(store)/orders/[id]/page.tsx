"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  MdArrowBack,
  MdCancel,
  MdInventory2,
  MdOpenInNew,
  MdUploadFile,
} from "react-icons/md";
import {
  cancelOrder,
  getMyOrder,
  submitPaymentProof,
  uploadPaymentProofImage,
} from "@/services/orders";
import { getStoredAuthToken } from "@/services/users";
import type { Order } from "@/types/domain/orders";
import { useCommerceSettings } from "@/lib/useCommerceSettings";
import ConfirmDialog from "@/components/ConfirmDialog";

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
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

const orderStatusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const orderStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagada",
  cancelled: "Cancelada",
};

const isCashPickupOrder = (order: Order): boolean =>
  order.paymentReference === "cash_on_pickup" || order.paymentMethod === "cash";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const {
    paymentsEnabled,
    manualPaymentInstructions,
    paymentsDisabledMessage,
    pickupMessage,
  } = useCommerceSettings();
  const orderId = String(params?.id ?? "").trim();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [paymentReceiptNumber, setPaymentReceiptNumber] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);

  const loadOrder = useCallback(async () => {
    if (!getStoredAuthToken()) {
      setIsLoading(false);
      router.replace("/login?redirect=%2Forders");
      return;
    }

    if (!orderId) {
      setIsLoading(false);
      return;
    }

    try {
      setOrder(await getMyOrder(orderId));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cargar el pedido";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const handleSubmitProof = async (event: FormEvent) => {
    event.preventDefault();
    if (!order || isUpdating) return;

    if (!paymentsEnabled) {
      toast.error(paymentsDisabledMessage);
      return;
    }

    const receiptNumber = paymentReceiptNumber.trim();
    if (!receiptNumber || !paymentProofFile) {
      toast.error("Carga el comprobante e indica el numero de operacion");
      return;
    }

    setIsUpdating(true);

    try {
      const uploadedProof = await uploadPaymentProofImage(
        order.id,
        paymentProofFile,
      );
      const updatedOrder = await submitPaymentProof({
        orderId: order.id,
        paymentReceiptNumber: receiptNumber,
        paymentProofUrl: uploadedProof.url,
        paymentProofPublicId: uploadedProof.publicId,
      });
      setOrder(updatedOrder);
      setPaymentReceiptNumber("");
      setPaymentProofFile(null);
      toast.success("Comprobante cargado. Queda en espera de confirmacion.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cargar el comprobante";
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || isUpdating) return;

    setIsUpdating(true);

    try {
      setOrder(await cancelOrder(order.id));
      setShowCancelConfirmation(false);
      toast.success("Pedido cancelado");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cancelar el pedido";
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <MdArrowBack size={18} />
            Volver a mis pedidos
          </Link>
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-10 text-center shadow-sm">
            <MdInventory2 className="mx-auto text-gray-400" size={48} />
            <p className="mt-4 text-lg font-medium text-gray-900">
              No se encontro el pedido
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isPending = order.status === "pending";

  return (
    <div className="min-h-screen bg-gray-50">
      <ConfirmDialog
        open={showCancelConfirmation}
        title="Cancelar pedido"
        description="Esta accion cancelara el pedido y no podras continuar con el pago desde esta orden."
        details={`Pedido ${order.orderNumber || order.id}`}
        confirmLabel="Si, cancelar pedido"
        cancelLabel="Conservar pedido"
        tone="danger"
        isBusy={isUpdating}
        busyLabel="Cancelando..."
        onCancel={() => setShowCancelConfirmation(false)}
        onConfirm={() => void handleCancelOrder()}
      />
      <div className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:py-8 sm:pb-24 lg:pb-8">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <MdArrowBack size={18} />
          Volver a mis pedidos
        </Link>

        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-gray-500">Pedido</p>
              <h1 className="break-all text-2xl font-bold text-gray-900">
                {order.orderNumber || order.id}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Creado el {formatDate(order.createdAt)}
              </p>
            </div>
            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                orderStatusStyles[order.status] ?? "bg-gray-100 text-gray-700"
              }`}
            >
              {orderStatusLabels[order.status] ?? order.status}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">Entrega</p>
              <p className="font-medium text-gray-900">
                {order.shippingAddress.address}
              </p>
              <p className="mt-1 text-xs text-gray-500">{pickupMessage}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-brand-600">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pago</p>
              <p className="font-medium text-gray-900">
                {isCashPickupOrder(order)
                  ? "Efectivo al retirar"
                  : order.paymentProofUrl
                    ? "Transferencia cargada"
                    : "Transferencia pendiente"}
              </p>
              {order.paymentReceiptNumber && (
                <p className="mt-1 text-sm text-gray-600">
                  Operacion: {order.paymentReceiptNumber}
                </p>
              )}
            </div>
          </div>
        </section>

        {isPending && (
          <section className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <h2 className="font-semibold text-amber-950">
              {isCashPickupOrder(order)
                ? "Pago en efectivo al retirar"
                : "Pago por transferencia o deposito"}
            </h2>
            {isCashPickupOrder(order) ? (
              <p className="mt-3 text-sm">
                Paga en efectivo cuando retires el pedido en tienda.
              </p>
            ) : (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {manualPaymentInstructions.map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-sm font-medium text-amber-950">
              Numero de pedido: {order.orderNumber || order.id}
            </p>
            <p className="mt-2 text-sm text-amber-900">
              El producto queda reservado durante 48 horas. Si no se registra el
              pago o comprobante a tiempo, el pedido se cancela automaticamente.
            </p>
          </section>
        )}

        {isPending && !isCashPickupOrder(order) && !order.paymentProofUrl && (
          <form
            onSubmit={handleSubmitProof}
            className="mt-5 grid gap-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_1fr_auto]"
          >
            <input
              value={paymentReceiptNumber}
              onChange={(event) => setPaymentReceiptNumber(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Numero de operacion"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setPaymentProofFile(event.target.files?.[0] ?? null)
              }
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={isUpdating || !paymentsEnabled}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MdUploadFile size={18} />
              {isUpdating ? "Cargando..." : "Subir comprobante"}
            </button>
            {!paymentsEnabled && (
              <p className="text-sm text-amber-700 md:col-span-3">
                {paymentsDisabledMessage}
              </p>
            )}
          </form>
        )}

        {order.paymentProofUrl && (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Comprobante cargado. Esperando confirmacion de administracion.
          </div>
        )}

        {isPending && (
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowCancelConfirmation(true)}
              disabled={isUpdating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 sm:w-auto"
            >
              <MdCancel size={18} />
              {isUpdating ? "Procesando..." : "Cancelar pedido"}
            </button>
          </div>
        )}

        <section className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Productos del pedido
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {order.items.map((item, index) => (
              <div
                key={`${order.id}-${item.productId}-${index}`}
                className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">
                    {item.productName}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Cantidad: {item.quantity}
                    {item.variantName ? ` | Variante: ${item.variantName}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Unitario: {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(item.lineTotal)}
                  </p>
                  <Link
                    href={`/products/${item.productId}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
                  >
                    Ver producto
                    <MdOpenInNew size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
