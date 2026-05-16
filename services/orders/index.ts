import {
  buildAuthHeaders,
  buildJsonHeaders,
  fetchWithAuthRetry,
  parseResponseOrThrow,
} from "@/lib/apiClient";
import type { Order, OrderItem, ShippingAddress } from "@/types/domain/orders";
import { type PaginatedResult } from "@/services/users";

interface OrderApiOptions {
  token?: string | null;
  signal?: AbortSignal;
}

export type DeliveryMethod = "pickup" | "delivery";
export type CheckoutPaymentMethod = "transfer" | "cash";

const PAYMENT_PROOF_TARGET_SIZE_BYTES = 2 * 1024 * 1024;
const PAYMENT_PROOF_MAX_DIMENSION = 1600;

const getCompressedFileName = (fileName: string): string => {
  const baseName = fileName.replace(/\.[^.]+$/, "") || "comprobante";
  return `${baseName}.jpg`;
};

const loadImageFromFile = async (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo procesar la imagen"));
    };
    image.src = objectUrl;
  });

const canvasToBlob = async (
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo comprimir la imagen"));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });

const compressPaymentProofImage = async (file: File): Promise<File> => {
  if (
    typeof window === "undefined" ||
    !file.type.startsWith("image/") ||
    file.size <= PAYMENT_PROOF_TARGET_SIZE_BYTES
  ) {
    return file;
  }

  try {
    const image = await loadImageFromFile(file);
    const originalWidth = image.naturalWidth || image.width;
    const originalHeight = image.naturalHeight || image.height;

    if (!originalWidth || !originalHeight) return file;

    const scale = Math.min(
      1,
      PAYMENT_PROOF_MAX_DIMENSION / Math.max(originalWidth, originalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(originalWidth * scale));
    canvas.height = Math.max(1, Math.round(originalHeight * scale));

    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const qualityLevels = [0.82, 0.72, 0.62, 0.52];
    let smallestBlob: Blob | null = null;

    for (const quality of qualityLevels) {
      const blob = await canvasToBlob(canvas, quality);
      if (!smallestBlob || blob.size < smallestBlob.size) {
        smallestBlob = blob;
      }
      if (blob.size <= PAYMENT_PROOF_TARGET_SIZE_BYTES) {
        return new File([blob], getCompressedFileName(file.name), {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
      }
    }

    return smallestBlob
      ? new File([smallestBlob], getCompressedFileName(file.name), {
          type: "image/jpeg",
          lastModified: Date.now(),
        })
      : file;
  } catch {
    return file;
  }
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const normalizeOrderItem = (value: unknown): OrderItem => {
  const item = asRecord(value);

  return {
    productId: String(item.productId ?? ""),
    variantName:
      typeof item.variantName === "string" ? item.variantName : null,
    quantity: Number(item.quantity ?? 0),
    productName: String(item.productName ?? ""),
    thumbnail: typeof item.thumbnail === "string" ? item.thumbnail : null,
    unitPrice: Number(item.unitPrice ?? 0),
    lineTotal: Number(item.lineTotal ?? 0),
  };
};

const normalizeShippingAddress = (value: unknown): ShippingAddress => {
  const address = asRecord(value);

  return {
    address: String(address.address ?? ""),
    name: typeof address.name === "string" ? address.name : null,
    phone: typeof address.phone === "string" ? address.phone : null,
  };
};

const normalizeEnumValue = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const formatLegacyOrderNumber = (orderId: string): string => {
  const shortId = orderId.slice(-6).toUpperCase();
  return shortId ? `PED-${shortId}` : "";
};

const normalizeOrder = (value: unknown): Order => {
  const order = asRecord(value);
  const user = asRecord(order.user);
  const id = String(order.id ?? "");

  return {
    id,
    orderNumber:
      typeof order.orderNumber === "string" && order.orderNumber.trim()
        ? order.orderNumber.trim()
        : formatLegacyOrderNumber(id),
    userId: String(order.userId ?? ""),
    user: order.user
      ? {
          id: String(user.id ?? ""),
          username: String(user.username ?? ""),
          email: String(user.email ?? ""),
          isEmailVerified: Boolean(user.isEmailVerified),
          status: String(user.status ?? ""),
          role: String(user.role ?? ""),
          name: typeof user.name === "string" ? user.name : null,
          phone: typeof user.phone === "string" ? user.phone : null,
          address: typeof user.address === "string" ? user.address : null,
          createdAt: typeof user.createdAt === "string" ? user.createdAt : null,
          updatedAt: typeof user.updatedAt === "string" ? user.updatedAt : null,
        }
      : null,
    items: Array.isArray(order.items) ? order.items.map(normalizeOrderItem) : [],
    totalAmount: Number(order.totalAmount ?? 0),
    shippingAddress: normalizeShippingAddress(order.shippingAddress),
    deliveryMethod: normalizeEnumValue(order.deliveryMethod) || null,
    status: normalizeEnumValue(order.status),
    paymentMethod: normalizeEnumValue(order.paymentMethod),
    paymentReference:
      typeof order.paymentReference === "string"
        ? order.paymentReference
        : null,
    paymentReceiptNumber:
      typeof order.paymentReceiptNumber === "string"
        ? order.paymentReceiptNumber
        : null,
    paymentProofUrl:
      typeof order.paymentProofUrl === "string" ? order.paymentProofUrl : null,
    paymentProofPublicId:
      typeof order.paymentProofPublicId === "string"
        ? order.paymentProofPublicId
        : null,
    paymentProofSubmittedAt:
      typeof order.paymentProofSubmittedAt === "string"
        ? order.paymentProofSubmittedAt
        : null,
    paidAt: typeof order.paidAt === "string" ? order.paidAt : null,
    cancelledAt:
      typeof order.cancelledAt === "string" ? order.cancelledAt : null,
    createdAt: typeof order.createdAt === "string" ? order.createdAt : null,
    updatedAt: typeof order.updatedAt === "string" ? order.updatedAt : null,
  };
};

const normalizeOrders = (value: unknown): Order[] =>
  Array.isArray(value) ? value.map(normalizeOrder) : [];

export const checkoutCart = async (
  input: {
    deliveryMethod?: DeliveryMethod;
    paymentMethod?: CheckoutPaymentMethod;
  } = {},
  options: OrderApiOptions = {},
): Promise<Order> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/orders/checkout", {
      method: "POST",
      headers: buildJsonHeaders(token),
      body: JSON.stringify({
        deliveryMethod: input.deliveryMethod ?? "pickup",
        paymentMethod: input.paymentMethod ?? "transfer",
      }),
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<unknown>(
      response,
      "No se pudo completar la compra",
    );
    return normalizeOrder(data);
  }, "No se pudo completar la compra", options);
};

export const listMyOrders = async (
  options: OrderApiOptions = {},
): Promise<Order[]> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/orders", {
      headers: buildJsonHeaders(token),
      cache: "no-store",
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<unknown>(
      response,
      "No se pudieron cargar los pedidos",
    );
    return normalizeOrders(data);
  }, "No se pudieron cargar los pedidos", options);
};

export const getMyOrder = async (
  orderId: string,
  options: OrderApiOptions = {},
): Promise<Order> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      headers: buildJsonHeaders(token),
      cache: "no-store",
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<unknown>(
      response,
      "No se pudo cargar el pedido",
    );
    return normalizeOrder(data);
  }, "No se pudo cargar el pedido", options);
};

export const payOrder = async (
  orderId: string,
  options: OrderApiOptions = {},
): Promise<Order> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/orders/pay", {
      method: "POST",
      headers: buildJsonHeaders(token),
      body: JSON.stringify({ orderId }),
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<unknown>(
      response,
      "No se pudo actualizar el pago",
    );
    return normalizeOrder(data);
  }, "No se pudo actualizar el pago", options);
};

export const uploadPaymentProofImage = async (
  orderId: string,
  file: File,
  options: OrderApiOptions = {},
): Promise<{ url: string; publicId: string }> => {
  return fetchWithAuthRetry(async (token) => {
    const uploadFile = await compressPaymentProofImage(file);
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("folder", "payment-proofs");
    formData.append("orderId", orderId);

    const response = await fetch("/api/cloudinary/upload", {
      method: "POST",
      headers: buildAuthHeaders(options.token ?? token),
      body: formData,
      signal: options.signal,
    });

    return parseResponseOrThrow<{ url: string; publicId: string }>(
      response,
      "Error subiendo imagen",
    );
  }, "Error subiendo imagen", options);
};

export const submitPaymentProof = async (
  input: {
    orderId: string;
    paymentReceiptNumber: string;
    paymentProofUrl: string;
    paymentProofPublicId: string;
  },
  options: OrderApiOptions = {},
): Promise<Order> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/orders/payment-proof", {
      method: "POST",
      headers: buildJsonHeaders(token),
      body: JSON.stringify(input),
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<unknown>(
      response,
      "No se pudo enviar el comprobante",
    );
    return normalizeOrder(data);
  }, "No se pudo enviar el comprobante", options);
};

export const cancelOrder = async (
  orderId: string,
  options: OrderApiOptions = {},
): Promise<Order> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/orders/cancel", {
      method: "POST",
      headers: buildJsonHeaders(token),
      body: JSON.stringify({ orderId }),
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<unknown>(
      response,
      "No se pudo cancelar el pedido",
    );
    return normalizeOrder(data);
  }, "No se pudo cancelar el pedido", options);
};

export interface AdminOrder extends Order {
  user?: {
    id: string;
    username: string;
    email: string;
    isEmailVerified: boolean;
    status: string;
    role: string;
    name?: string | null;
    phone?: string | null;
    address?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } | null;
}

interface ListAdminOrdersParams {
  orderId?: string;
  page?: number;
  limit?: number;
  userId?: string;
  status?: string;
}

export const listAdminOrders = async (
  params: ListAdminOrdersParams = {},
  options: OrderApiOptions = {},
): Promise<PaginatedResult<AdminOrder>> => {
  return fetchWithAuthRetry(async (token) => {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 20));
    if (params.orderId?.trim()) query.set("orderId", params.orderId.trim());
    if (params.userId?.trim()) query.set("userId", params.userId.trim());
    if (params.status?.trim()) query.set("status", params.status.trim());

    const response = await fetch(`/api/admin/orders?${query.toString()}`, {
      headers: buildJsonHeaders(token),
      cache: "no-store",
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<PaginatedResult<unknown>>(
      response,
      "No se pudieron cargar los pedidos",
    );

    return {
      items: Array.isArray(data.items)
        ? (data.items.map((item) => normalizeOrder(item)) as AdminOrder[])
        : [],
      total: Number(data.total ?? 0),
      page: Number(data.page ?? 1),
      totalPages: Number(data.totalPages ?? 1),
    };
  }, "No se pudieron cargar los pedidos", options);
};

export const adminPayOrder = async (
  orderId: string,
  options: OrderApiOptions = {},
): Promise<AdminOrder> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/admin/orders/pay", {
      method: "POST",
      headers: buildJsonHeaders(token),
      body: JSON.stringify({ orderId }),
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<unknown>(
      response,
      "No se pudo marcar el pedido como pagado",
    );
    return normalizeOrder(data) as AdminOrder;
  }, "No se pudo marcar el pedido como pagado", options);
};

export const adminUnpayOrder = async (
  orderId: string,
  options: OrderApiOptions = {},
): Promise<AdminOrder> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/admin/orders/unpay", {
      method: "POST",
      headers: buildJsonHeaders(token),
      body: JSON.stringify({ orderId }),
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<unknown>(
      response,
      "No se pudo revertir el pago",
    );
    return normalizeOrder(data) as AdminOrder;
  }, "No se pudo revertir el pago", options);
};

export const adminCancelOrder = async (
  orderId: string,
  options: OrderApiOptions = {},
): Promise<AdminOrder> => {
  return fetchWithAuthRetry(async (token) => {
    const response = await fetch("/api/admin/orders/cancel", {
      method: "POST",
      headers: buildJsonHeaders(token),
      body: JSON.stringify({ orderId }),
      signal: options.signal,
    });

    const data = await parseResponseOrThrow<unknown>(
      response,
      "No se pudo cancelar el pedido",
    );
    return normalizeOrder(data) as AdminOrder;
  }, "No se pudo cancelar el pedido", options);
};
