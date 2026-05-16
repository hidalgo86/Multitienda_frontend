"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MdCancel,
  MdChevronRight,
  MdFilterList,
  MdInventory2,
  MdReceiptLong,
} from "react-icons/md";
import { cancelOrder, listMyOrders } from "@/services/orders";
import { getStoredAuthToken } from "@/services/users";
import type { Order } from "@/types/domain/orders";
import {
  PAYMENTS_ENABLED,
  paymentsDisabledMessage,
  pickupMessage,
} from "@/lib/commerceConfig";
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

const orderStatusFilters = [
  { value: "pending", label: "Pendientes" },
  { value: "paid", label: "Pagadas" },
  { value: "cancelled", label: "Canceladas" },
  { value: "all", label: "Todas" },
] as const;

type OrderStatusFilter = (typeof orderStatusFilters)[number]["value"];

export default function OrdersClient() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<OrderStatusFilter>("pending");

  const loadOrders = useCallback(async () => {
    const token = getStoredAuthToken();

    if (!token) {
      setIsLoading(false);
      router.replace("/login?redirect=%2Forders");
      return;
    }

    try {
      const orderList = await listMyOrders();
      setOrders(Array.isArray(orderList) ? orderList : []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron cargar tus pedidos";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleCancelOrder = async (orderId: string) => {
    setActiveOrderId(orderId);

    try {
      const updatedOrder = await cancelOrder(orderId);
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? updatedOrder : order)),
      );
      setOrderToCancel(null);
      toast.success("Pedido cancelado");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cancelar el pedido";
      toast.error(message);
    } finally {
      setActiveOrderId(null);
    }
  };

  const orderCounts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((order) => order.status === "pending").length,
      paid: orders.filter((order) => order.status === "paid").length,
      cancelled: orders.filter((order) => order.status === "cancelled").length,
    }),
    [orders],
  );

  const filteredOrders = useMemo(
    () =>
      statusFilter === "all"
        ? orders
        : orders.filter((order) => order.status === statusFilter),
    [orders, statusFilter],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tus pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ConfirmDialog
        open={Boolean(orderToCancel)}
        title="Cancelar pedido"
        description="Esta accion cancelara el pedido y no podras continuar con el pago desde esta orden."
        details={
          orderToCancel
            ? `Pedido ${orderToCancel.orderNumber || orderToCancel.id}`
            : undefined
        }
        confirmLabel="Si, cancelar pedido"
        cancelLabel="Conservar pedido"
        tone="danger"
        isBusy={Boolean(orderToCancel && activeOrderId === orderToCancel.id)}
        busyLabel="Cancelando..."
        onCancel={() => setOrderToCancel(null)}
        onConfirm={() => {
          if (!orderToCancel) return;
          void handleCancelOrder(orderToCancel.id);
        }}
      />
      <div className="max-w-6xl mx-auto px-4 py-6 pb-24 sm:py-8 sm:pb-24 lg:pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MdReceiptLong className="text-brand-700" />
              Mis Pedidos
            </h1>
            <p className="mt-2 text-gray-600">
              Primero veras los pendientes de pago. Usa los filtros para revisar
              pagados o cancelados.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadOrders()}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Actualizar
          </button>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
            <MdFilterList size={18} />
            Filtrar por estado
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {orderStatusFilters.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  statusFilter === option.value
                    ? "bg-gray-900 text-white"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {option.label} ({orderCounts[option.value]})
              </button>
            ))}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-lg bg-white border border-gray-200 p-10 text-center shadow-sm">
            <MdInventory2 className="mx-auto text-gray-400" size={48} />
            <p className="mt-4 text-lg font-medium text-gray-900">
              Todavia no has realizado compras
            </p>
            <p className="mt-2 text-gray-600">
              Cuando completes tu primer checkout, tus pedidos apareceran aqui.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex px-5 py-3 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
            >
              Explorar productos
            </Link>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-lg bg-white border border-gray-200 p-10 text-center shadow-sm">
            <MdInventory2 className="mx-auto text-gray-400" size={48} />
            <p className="mt-4 text-lg font-medium text-gray-900">
              No hay pedidos en este estado
            </p>
            <p className="mt-2 text-gray-600">
              Cambia el filtro para ver otros pedidos registrados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isPending = order.status === "pending";
              const isBusy = activeOrderId === order.id;
              const productCount = Array.isArray(order.items)
                ? order.items.reduce((total, item) => total + item.quantity, 0)
                : 0;

              return (
                <article
                  key={order.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Pedido</p>
                      <p className="truncate font-semibold text-gray-900">
                        {order.orderNumber || order.id}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Creado el {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        orderStatusStyles[order.status] ??
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {orderStatusLabels[order.status] ?? order.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                    <div>
                      <p className="text-gray-500">Entrega</p>
                      <p className="font-medium text-gray-900">
                        {order.shippingAddress.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Productos</p>
                      <p className="font-semibold text-gray-900">
                        {productCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pago</p>
                      <p className="font-medium text-gray-900">
                        {isCashPickupOrder(order)
                          ? "Efectivo al retirar"
                          : order.paymentProofUrl
                            ? "Transferencia cargada"
                            : "Transferencia pendiente"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="text-lg font-bold text-brand-600">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black sm:w-auto"
                    >
                      Ver detalle
                      <MdChevronRight size={18} />
                    </Link>
                    {isPending &&
                      !isCashPickupOrder(order) &&
                      !order.paymentProofUrl &&
                      PAYMENTS_ENABLED && (
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex w-full items-center justify-center rounded-md border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 sm:w-auto"
                      >
                        Subir comprobante
                      </Link>
                    )}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => setOrderToCancel(order)}
                        disabled={isBusy}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 sm:w-auto"
                      >
                        <MdCancel size={18} />
                        {isBusy ? "Procesando..." : "Cancelar pedido"}
                      </button>
                    )}
                  </div>

                  {isPending ? (
                    <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      {order.paymentProofUrl
                        ? "Comprobante recibido. El pedido queda pendiente de revision de administracion."
                        : "Recuerda pagar o subir el comprobante dentro de 48 horas para mantener la reserva."}
                    </p>
                  ) : (
                    <p className="mt-3 text-xs text-gray-500">{pickupMessage}</p>
                  )}
                  {isPending && !PAYMENTS_ENABLED && (
                    <p className="mt-3 text-sm text-amber-700">
                      {paymentsDisabledMessage}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
