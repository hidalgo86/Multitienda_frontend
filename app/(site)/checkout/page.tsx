"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { MdCheckCircle, MdLocationOn, MdShoppingCart } from "react-icons/md";
import { useCartActions } from "@/lib/useCartActions";
import { useSubmitCooldown } from "@/lib/useSubmitCooldown";
import {
  checkoutCart,
  submitPaymentProof,
  uploadPaymentProofImage,
} from "@/services/orders";
import {
  PAYMENTS_ENABLED,
  checkoutDisabledMessage,
  deliveryDisabledMessage,
  manualPaymentInstructions,
  pickupMessage,
  storePickupAddress,
} from "@/lib/commerceConfig";
import {
  getCurrentUser,
  getStoredAuthToken,
} from "@/services/users";
import { syncCart } from "@/store/slices/cartSlice";
import type { Order } from "@/types/domain/orders";
import type { User } from "@/types/domain/users";
import type { AppDispatch } from "@/store";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { cart } = useCartActions();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [paymentReceiptNumber, setPaymentReceiptNumber] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">(
    "pickup",
  );
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "cash">(
    "transfer",
  );
  const { isCoolingDown, remainingSeconds, startCooldown } =
    useSubmitCooldown(5);

  useEffect(() => {
    if (!PAYMENTS_ENABLED) {
      setIsLoadingUser(false);
      return;
    }

    const token = getStoredAuthToken();

    if (!token) {
      setRequiresAuth(true);
      setIsLoadingUser(false);
      return;
    }

    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo cargar tu cuenta";
        toast.error(message);
        setRequiresAuth(true);
      } finally {
        setIsLoadingUser(false);
      }
    };

    void loadUser();
  }, [router]);

  const hasVerifiedEmail = Boolean(user?.isEmailVerified);
  const hasCompleteShippingProfile = Boolean(
    user?.name?.trim() && user?.phone?.trim() && user?.address?.trim(),
  );
  const needsShippingProfile = deliveryMethod === "delivery";
  const canCheckout =
    cart.items.length > 0 &&
    hasVerifiedEmail &&
    (!needsShippingProfile || hasCompleteShippingProfile);

  const orderSummary = useMemo(
    () =>
      cart.items.map((item) => ({
        key: `${item.id}-${item.selectedSize ?? ""}`,
        name: item.name,
        quantity: item.quantity,
        variant: item.selectedSize,
        price:
          (item.variants?.find(
            (variant) =>
              variant.name?.trim().toLowerCase() ===
              item.selectedSize?.trim().toLowerCase(),
          )?.price ??
            item.price ??
            0) * item.quantity,
      })),
    [cart.items],
  );

  const handleCheckout = async () => {
    if (isSubmitting || isCoolingDown) return;

    if (!PAYMENTS_ENABLED) {
      toast.error(checkoutDisabledMessage);
      return;
    }
    if (!canCheckout) return;

    setIsSubmitting(true);

    try {
      const order = await checkoutCart({ deliveryMethod, paymentMethod });
      setCreatedOrder({
        ...order,
        paymentMethod:
          paymentMethod === "cash" ? "cash" : order.paymentMethod,
        paymentReference:
          paymentMethod === "cash" ? "cash_on_pickup" : "bank_transfer",
      });
      dispatch(syncCart([]));
      toast.success("Compra completada");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo completar la compra";
      toast.error(message);
      startCooldown();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitProof = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createdOrder || isSubmittingProof) return;

    const receiptNumber = paymentReceiptNumber.trim();
    if (!receiptNumber || !paymentProofFile) {
      toast.error("Carga el comprobante e indica el numero de operacion");
      return;
    }

    setIsSubmittingProof(true);

    try {
      const uploadedProof = await uploadPaymentProofImage(
        createdOrder.id,
        paymentProofFile,
      );
      const updatedOrder = await submitPaymentProof({
        orderId: createdOrder.id,
        paymentReceiptNumber: receiptNumber,
        paymentProofUrl: uploadedProof.url,
        paymentProofPublicId: uploadedProof.publicId,
      });

      setCreatedOrder(updatedOrder);
      setPaymentReceiptNumber("");
      setPaymentProofFile(null);
      toast.success("Comprobante cargado. Tu pedido queda en espera de confirmacion.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cargar el comprobante";
      toast.error(message);
    } finally {
      setIsSubmittingProof(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto" />
          <p className="mt-4 text-gray-600">Preparando checkout...</p>
        </div>
      </div>
    );
  }

  if (!PAYMENTS_ENABLED) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <MdShoppingCart className="mx-auto text-slate-400" size={64} />
            <h1 className="mt-4 text-3xl font-bold text-gray-900">
              Checkout no disponible todavia
            </h1>
            <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
              {checkoutDisabledMessage}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/cart"
                className="px-6 py-3 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
              >
                Volver al carrito
              </Link>
              <Link
                href="/products"
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Seguir explorando
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (requiresAuth) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
              <MdShoppingCart className="text-brand-600" size={48} />
              <h1 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
                Guarda tu pedido antes de continuar
              </h1>
              <p className="mt-3 text-gray-600">
                Inicia sesion o crea una cuenta para reservar el stock, guardar
                tu carrito y ver el estado del pedido cuando vuelvas.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login?redirect=%2Fcheckout"
                  className="inline-flex justify-center rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-black"
                >
                  Iniciar sesion
                </Link>
                <Link
                  href="/register?redirect=%2Fcheckout"
                  className="inline-flex justify-center rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Crear cuenta
                </Link>
              </div>

              <Link
                href="/cart"
                className="mt-4 inline-flex text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                Volver al carrito
              </Link>
            </section>

            <aside className="rounded-2xl bg-white p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900">
                Tu carrito te espera
              </h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Productos ({cart.totalItems})
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(cart.totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Entrega</span>
                  <span className="font-medium text-green-600">
                    Retiro en tienda
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-brand-600">
                      {formatCurrency(cart.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {cart.items.length > 0 ? (
                <div className="mt-5 max-h-64 space-y-3 overflow-y-auto pr-1">
                  {cart.items.map((item) => (
                    <div
                      key={`${item.id}-${item.selectedSize ?? ""}-${item.selectedColor ?? ""}`}
                      className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                    >
                      <p className="line-clamp-1 font-medium text-gray-900">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Cantidad: {item.quantity}
                        {item.selectedSize
                          ? ` - Variante: ${item.selectedSize}`
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  Tu carrito esta vacio. Puedes volver a productos y elegir algo
                  antes de iniciar sesion.
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    );
  }

  if (createdOrder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <MdCheckCircle className="mx-auto text-green-500" size={72} />
            <h1 className="mt-4 text-3xl font-bold text-gray-900">
              Pedido creado con exito
            </h1>
            <p className="mt-3 text-gray-600">
              Tu orden fue registrada correctamente y queda en espera de pago.
            </p>

            <div className="mt-8 rounded-xl bg-gray-50 p-5 text-left">
              <p className="text-sm text-gray-500">Numero de orden</p>
              <p className="font-semibold text-gray-900">
                {createdOrder.orderNumber || createdOrder.id}
              </p>
              <p className="mt-4 text-sm text-gray-500">Total</p>
              <p className="font-semibold text-gray-900">
                {formatCurrency(createdOrder.totalAmount)}
              </p>
              <p className="mt-4 text-sm text-gray-500">Entrega</p>
              <p className="font-semibold text-gray-900">
                {createdOrder.deliveryMethod === "pickup"
                  ? "Retiro en tienda"
                  : createdOrder.shippingAddress.address}
              </p>
              {createdOrder.deliveryMethod === "pickup" && (
                <p className="mt-1 text-sm text-gray-700">
                  {storePickupAddress}
                </p>
              )}
            </div>

            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-left">
              <h2 className="font-semibold text-amber-950">
                {createdOrder.paymentReference === "cash_on_pickup"
                  ? "Pago en efectivo al retirar"
                  : "Pago por transferencia o deposito"}
              </h2>
              {createdOrder.paymentReference === "cash_on_pickup" ? (
                <p className="mt-3 text-sm text-amber-900">
                  Paga en efectivo cuando retires el pedido en la tienda. Tu
                  orden quedara pendiente hasta que administracion confirme el
                  pago.
                </p>
              ) : (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">
                  {manualPaymentInstructions.map((instruction) => (
                    <li key={instruction}>{instruction}</li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-sm font-medium text-amber-950">
                Numero de pedido: {createdOrder.orderNumber || createdOrder.id}
              </p>
              <p className="mt-2 text-sm text-amber-900">
                El stock queda reservado durante 48 horas. Si no se registra el
                pago o comprobante en ese plazo, el pedido se cancela
                automaticamente y el producto vuelve a estar disponible.
              </p>
            </div>

            {createdOrder.paymentReference === "cash_on_pickup" ? null : createdOrder.paymentProofUrl ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-left text-sm text-emerald-900">
                Comprobante recibido. Numero de operacion:{" "}
                <span className="font-semibold">
                  {createdOrder.paymentReceiptNumber}
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitProof}
                className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-5 text-left"
              >
                <label className="block text-sm font-medium text-gray-700">
                  Numero de operacion o comprobante
                  <input
                    value={paymentReceiptNumber}
                    onChange={(event) => setPaymentReceiptNumber(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Ej. transferencia 123456"
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Imagen del comprobante
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setPaymentProofFile(event.target.files?.[0] ?? null)
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSubmittingProof}
                  className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {isSubmittingProof ? "Cargando..." : "Cargar comprobante"}
                </button>
              </form>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/products"
                className="px-6 py-3 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
              >
                Seguir comprando
              </Link>
              <Link
                href="/account"
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Ver mi cuenta
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const checkoutButtonLabel = isSubmitting
    ? "Procesando compra..."
    : isCoolingDown
      ? `Espera ${remainingSeconds}s`
      : !hasVerifiedEmail
        ? "Verifica tu correo"
        : needsShippingProfile && !hasCompleteShippingProfile
          ? "Completa tus datos"
          : "Confirmar compra";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="mt-2 text-gray-600">
            Revisa tu pedido y confirma el metodo de entrega.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-8">
          <section className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <MdLocationOn className="text-brand-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-900">
                  Metodo de entrega
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="rounded-xl border border-brand-300 bg-brand-50 p-4 text-sm text-brand-950">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="pickup"
                    checked={deliveryMethod === "pickup"}
                    onChange={() => setDeliveryMethod("pickup")}
                    className="mr-2"
                  />
                  <span className="font-semibold">Retiro en tienda</span>
                  <p className="mt-2 text-brand-800">{pickupMessage}</p>
                </label>
                <label className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="delivery"
                    checked={deliveryMethod === "delivery"}
                    onChange={() => setDeliveryMethod("delivery")}
                    disabled
                    className="mr-2"
                  />
                  <span className="font-semibold">Envio a domicilio</span>
                  <p className="mt-2">{deliveryDisabledMessage}</p>
                </label>
              </div>

              {!hasVerifiedEmail && (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  Debes verificar tu correo antes de comprar.
                  <div className="mt-3">
                    <Link
                      href={`/verify?userId=${user?.id ?? ""}`}
                      className="inline-flex rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                    >
                      Verificar correo
                    </Link>
                  </div>
                </div>
              )}

              {needsShippingProfile && !hasCompleteShippingProfile && (
                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Para envio a domicilio debes completar nombre, telefono y
                  direccion.
                  <div className="mt-3">
                    <Link
                      href="/account"
                      className="inline-flex rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700"
                    >
                      Completar datos
                    </Link>
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-2 text-sm sm:text-base">
                <p>
                  <span className="font-medium text-gray-900">Nombre:</span>{" "}
                  {user?.name?.trim() || "No registrado"}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Telefono:</span>{" "}
                  {user?.phone?.trim() || "No registrado"}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Direccion:</span>{" "}
                  {user?.address?.trim() || "No registrada"}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <MdCheckCircle className="text-emerald-500" size={24} />
                <h2 className="text-xl font-semibold text-gray-900">
                  Forma de pago
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label
                  className={`rounded-xl border p-4 text-sm ${
                    paymentMethod === "transfer"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="transfer"
                    checked={paymentMethod === "transfer"}
                    onChange={() => setPaymentMethod("transfer")}
                    className="mr-2"
                  />
                  <span className="font-semibold">Transferencia o deposito</span>
                  <p className="mt-2 text-emerald-800">
                    El pedido queda pendiente hasta que subas el comprobante y
                    administracion lo confirme.
                  </p>
                </label>
                <label
                  className={`rounded-xl border p-4 text-sm ${
                    paymentMethod === "cash"
                      ? "border-amber-300 bg-amber-50 text-amber-950"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                    className="mr-2"
                  />
                  <span className="font-semibold">Efectivo al retirar</span>
                  <p className="mt-2 text-amber-800">
                    El cliente paga en la tienda al retirar el pedido.
                  </p>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <MdShoppingCart className="text-brand-500" size={24} />
                <h2 className="text-xl font-semibold text-gray-900">
                  Productos
                </h2>
              </div>

              {cart.items.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 text-gray-600">
                  Tu carrito esta vacio.
                  <div className="mt-3">
                    <Link
                      href="/products"
                      className="inline-flex px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                    >
                      Ir a productos
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {orderSummary.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Cantidad: {item.quantity}
                          {item.variant ? ` • Variante: ${item.variant}` : ""}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="lg:sticky lg:top-6 h-fit">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Resumen
              </h2>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Productos ({cart.totalItems})
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(cart.totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Envio</span>
                  <span className="font-medium text-green-600">Gratis</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-brand-600">
                    {formatCurrency(cart.totalPrice)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={!canCheckout || isSubmitting || isCoolingDown}
                className="mt-6 w-full px-6 py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutButtonLabel}
              </button>

              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/cart"
                  className="text-center px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Volver al carrito
                </Link>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Se generara una orden en espera de pago. El stock queda
                  reservado durante 48 horas; si no se registra pago o
                  comprobante, el pedido se cancela automaticamente.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
