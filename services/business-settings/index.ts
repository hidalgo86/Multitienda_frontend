import {
  COOKIE_SESSION_MARKER,
  getStoredAuthToken,
  refreshSession,
} from "@/services/users";
import type {
  BusinessColorPalette,
  BusinessSettings,
  UpdateBusinessSettingsInput,
} from "@/types/domain/business-settings";
import { defaultBrandPalette } from "@/lib/brandPalettes";

interface ApiOptions {
  baseUrl?: string;
  cache?: RequestCache;
  signal?: AbortSignal;
  token?: string | null;
}

type RawBusinessSettings = Partial<BusinessSettings> & { _id?: string | null };
export const defaultManualPaymentInstructions = [
  "Realiza el pago por transferencia o deposito a la cuenta indicada por la tienda.",
  "Luego carga el comprobante y el numero de operacion en tu pedido.",
  "El pedido quedara en espera hasta que administracion confirme que el pago entro en la cuenta.",
];

export const defaultCheckoutDisabledMessage =
  "Ya puedes explorar la tienda, guardar favoritos y usar el carrito. La compra estara disponible cuando activemos los pagos.";

export const defaultDeliveryDisabledMessage =
  "El envio a domicilio estara disponible proximamente.";
export const defaultSeoDescription =
  "Compra productos seleccionados en nuestra tienda online.";
export const defaultAboutText =
  "Conoce mas sobre nuestra tienda, productos y forma de atender cada compra.";

class ApiResponseError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiResponseError";
  }
}

const buildApiUrl = (path: string, baseUrl?: string): string => {
  if (!baseUrl) return path;
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
};

const parseResponseOrThrow = async <T>(
  response: Response,
  fallbackErrorMessage: string,
): Promise<T> => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiResponseError(
      typeof data?.error === "string" && data.error.trim()
        ? data.error
        : fallbackErrorMessage,
      response.status,
    );
  }

  return data as T;
};

const normalizeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeSettings = (raw: RawBusinessSettings): BusinessSettings => ({
  id: normalizeString(raw.id) || normalizeString(raw._id) || undefined,
  businessName: normalizeString(raw.businessName) || "Tienda online",
  legalName: normalizeString(raw.legalName),
  email: normalizeString(raw.email),
  phone: normalizeString(raw.phone),
  address: normalizeString(raw.address),
  city: normalizeString(raw.city),
  state: normalizeString(raw.state),
  country: normalizeString(raw.country),
  logoUrl: normalizeString(raw.logoUrl) || "/placeholder.webp",
  logoPublicId:
    typeof raw.logoPublicId === "string" && raw.logoPublicId.trim()
      ? raw.logoPublicId.trim()
      : null,
  extraFields: Array.isArray(raw.extraFields)
    ? raw.extraFields
        .map((field) => ({
          label: normalizeString(field?.label),
          value: normalizeString(field?.value),
        }))
        .filter((field) => field.label || field.value)
    : [],
  colorPalette: normalizeColorPalette(raw.colorPalette),
  paymentsEnabled:
    typeof raw.paymentsEnabled === "boolean" ? raw.paymentsEnabled : true,
  checkoutDisabledMessage:
    normalizeString(raw.checkoutDisabledMessage) ||
    defaultCheckoutDisabledMessage,
  storePickupAddress: normalizeString(raw.storePickupAddress || raw.address),
  pickupMessage:
    normalizeString(raw.pickupMessage) ||
    `Retiro en tienda: ${normalizeString(raw.storePickupAddress || raw.address)} No se realizan envios por el momento.`,
  deliveryEnabled:
    typeof raw.deliveryEnabled === "boolean" ? raw.deliveryEnabled : false,
  deliveryDisabledMessage:
    normalizeString(raw.deliveryDisabledMessage) ||
    defaultDeliveryDisabledMessage,
  manualPaymentInstructions: Array.isArray(raw.manualPaymentInstructions)
    ? raw.manualPaymentInstructions
        .map((instruction) => normalizeString(instruction))
        .filter(Boolean)
    : defaultManualPaymentInstructions,
  seoTitle: normalizeString(raw.seoTitle || raw.businessName) || "Tienda online",
  seoDescription:
    normalizeString(raw.seoDescription) || defaultSeoDescription,
  ogImageUrl: normalizeString(raw.ogImageUrl) || "/placeholder.webp",
  instagramUrl: normalizeString(raw.instagramUrl),
  aboutTitle:
    normalizeString(raw.aboutTitle) ||
    `Acerca de ${normalizeString(raw.businessName) || "la tienda"}`,
  aboutText: normalizeString(raw.aboutText) || defaultAboutText,
  aboutImageUrl:
    normalizeString(raw.aboutImageUrl) ||
    normalizeString(raw.ogImageUrl) ||
    "/placeholder.webp",
  createdAt: normalizeString(raw.createdAt) || undefined,
  updatedAt: normalizeString(raw.updatedAt) || undefined,
});

const normalizeColorPalette = (value: unknown): BusinessColorPalette => {
  const raw =
    value && typeof value === "object"
      ? (value as Partial<BusinessColorPalette>)
      : {};

  return {
    ...defaultBrandPalette,
    ...raw,
    preset: normalizeString(raw.preset) || defaultBrandPalette.preset,
  };
};

const buildHeaders = (
  includeJson: boolean = false,
  token?: string | null,
): HeadersInit => {
  const headers: HeadersInit = {};
  if (includeJson) headers["Content-Type"] = "application/json";
  if (token && token !== COOKIE_SESSION_MARKER) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const storeRefreshedTokens = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("refreshToken");
  window.dispatchEvent(new Event("auth:session-changed"));
};

const fetchWithAuthRetry = async <T>(
  requestFactory: (token: string) => Promise<T>,
  fallbackErrorMessage: string,
  options: ApiOptions = {},
): Promise<T> => {
  const token = options.token ?? getStoredAuthToken();

  if (!token) {
    throw new Error("No hay sesion activa");
  }

  try {
    return await requestFactory(token);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.toLowerCase()
        : fallbackErrorMessage.toLowerCase();
    const status = error instanceof ApiResponseError ? error.status : null;
    const canRefreshSession =
      !options.token || options.token === COOKIE_SESSION_MARKER;
    const shouldRetry =
      canRefreshSession &&
      (status === 401 ||
        message.includes("token") ||
        message.includes("jwt") ||
        message.includes("unauthorized") ||
        message.includes("sesion"));

    if (!shouldRetry) {
      throw error;
    }

    const refreshedTokens = await refreshSession();
    storeRefreshedTokens();
    return requestFactory(refreshedTokens.access_token);
  }
};

export const getBusinessSettings = async (
  options: ApiOptions = {},
): Promise<BusinessSettings> => {
  const response = await fetch(buildApiUrl("/api/settings", options.baseUrl), {
    cache: options.cache ?? "no-store",
    signal: options.signal,
  });

  return normalizeSettings(
    await parseResponseOrThrow<RawBusinessSettings>(
      response,
      "Error al cargar la configuracion del negocio",
    ),
  );
};

export const getAdminBusinessSettings = async (
  options: ApiOptions = {},
): Promise<BusinessSettings> =>
  fetchWithAuthRetry(async (token) => {
    const response = await fetch(
      buildApiUrl("/api/admin/settings", options.baseUrl),
      {
        cache: options.cache ?? "no-store",
        headers: buildHeaders(false, options.token ?? token),
        signal: options.signal,
      },
    );

    return normalizeSettings(
      await parseResponseOrThrow<RawBusinessSettings>(
        response,
        "Error al cargar la configuracion del negocio",
      ),
    );
  }, "Error al cargar la configuracion del negocio", options);

export const updateBusinessSettings = async (
  input: UpdateBusinessSettingsInput,
  options: ApiOptions = {},
): Promise<BusinessSettings> =>
  fetchWithAuthRetry(async (token) => {
    const response = await fetch(
      buildApiUrl("/api/admin/settings", options.baseUrl),
      {
        method: "PATCH",
        headers: buildHeaders(true, options.token ?? token),
        body: JSON.stringify(input),
        signal: options.signal,
      },
    );

    return normalizeSettings(
      await parseResponseOrThrow<RawBusinessSettings>(
        response,
        "Error al guardar la configuracion del negocio",
      ),
    );
  }, "Error al guardar la configuracion del negocio", options);

export const uploadBusinessLogo = async (
  file: File,
  options: ApiOptions = {},
): Promise<{ url: string; publicId: string }> =>
  fetchWithAuthRetry(async () => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "logos");

    const response = await fetch(
      buildApiUrl("/api/cloudinary/upload", options.baseUrl),
      {
        method: "POST",
        body: formData,
        signal: options.signal,
      },
    );

    return parseResponseOrThrow<{ url: string; publicId: string }>(
      response,
      "Error al subir el logo",
    );
  }, "Error al subir el logo", options);
