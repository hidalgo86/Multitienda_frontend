import {
  defaultAboutText,
  defaultCheckoutDisabledMessage,
  defaultDeliveryDisabledMessage,
  defaultManualPaymentInstructions,
  defaultSeoDescription,
} from "@/services/business-settings";
import type { BusinessSettings } from "@/types/domain/business-settings";
import { defaultBrandPalette } from "./brandPalettes";

const query = `
  query BusinessSettings {
    businessSettings {
      id
      businessName
      legalName
      email
      phone
      address
      city
      state
      country
      logoUrl
      logoPublicId
      extraFields {
        label
        value
      }
      colorPalette {
        preset
        brand50
        brand100
        brand200
        brand300
        brand400
        brand500
        brand600
        brand700
        brand800
        brand900
        brand950
      }
      paymentsEnabled
      checkoutDisabledMessage
      storePickupAddress
      pickupMessage
      deliveryEnabled
      deliveryDisabledMessage
      manualPaymentInstructions
      seoTitle
      seoDescription
      ogImageUrl
      instagramUrl
      aboutTitle
      aboutText
      aboutImageUrl
      createdAt
      updatedAt
    }
  }
`;

const normalizeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const fallbackSettings = (): BusinessSettings => ({
  businessName: "Tienda online",
  legalName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  country: "",
  logoUrl: "/placeholder.webp",
  logoPublicId: null,
  extraFields: [],
  colorPalette: defaultBrandPalette,
  paymentsEnabled: true,
  checkoutDisabledMessage: defaultCheckoutDisabledMessage,
  storePickupAddress: "",
  pickupMessage: "Retiro en tienda disponible.",
  deliveryEnabled: false,
  deliveryDisabledMessage: defaultDeliveryDisabledMessage,
  manualPaymentInstructions: defaultManualPaymentInstructions,
  seoTitle: "Tienda online",
  seoDescription: defaultSeoDescription,
  ogImageUrl: "/placeholder.webp",
  instagramUrl: "",
  aboutTitle: "Acerca de la tienda",
  aboutText: defaultAboutText,
  aboutImageUrl: "/placeholder.webp",
});

const normalizeSettings = (raw: Partial<BusinessSettings> | null): BusinessSettings => {
  const fallback = fallbackSettings();
  const businessName = normalizeString(raw?.businessName) || fallback.businessName;
  const address = normalizeString(raw?.address);
  const pickupAddress = normalizeString(raw?.storePickupAddress) || address;

  return {
    id: normalizeString(raw?.id) || undefined,
    businessName,
    legalName: normalizeString(raw?.legalName),
    email: normalizeString(raw?.email),
    phone: normalizeString(raw?.phone),
    address,
    city: normalizeString(raw?.city),
    state: normalizeString(raw?.state),
    country: normalizeString(raw?.country),
    logoUrl: normalizeString(raw?.logoUrl) || fallback.logoUrl,
    logoPublicId: normalizeString(raw?.logoPublicId) || null,
    extraFields: Array.isArray(raw?.extraFields) ? raw.extraFields : [],
    colorPalette: raw?.colorPalette ?? fallback.colorPalette,
    paymentsEnabled:
      typeof raw?.paymentsEnabled === "boolean"
        ? raw.paymentsEnabled
        : fallback.paymentsEnabled,
    checkoutDisabledMessage:
      normalizeString(raw?.checkoutDisabledMessage) ||
      fallback.checkoutDisabledMessage,
    storePickupAddress: pickupAddress,
    pickupMessage:
      normalizeString(raw?.pickupMessage) ||
      (pickupAddress
        ? `Retiro en tienda: ${pickupAddress} No se realizan envios por el momento.`
        : fallback.pickupMessage),
    deliveryEnabled:
      typeof raw?.deliveryEnabled === "boolean"
        ? raw.deliveryEnabled
        : fallback.deliveryEnabled,
    deliveryDisabledMessage:
      normalizeString(raw?.deliveryDisabledMessage) ||
      fallback.deliveryDisabledMessage,
    manualPaymentInstructions: Array.isArray(raw?.manualPaymentInstructions)
      ? raw.manualPaymentInstructions.map(normalizeString).filter(Boolean)
      : fallback.manualPaymentInstructions,
    seoTitle: normalizeString(raw?.seoTitle) || businessName,
    seoDescription:
      normalizeString(raw?.seoDescription) || fallback.seoDescription,
    ogImageUrl: normalizeString(raw?.ogImageUrl) || fallback.ogImageUrl,
    instagramUrl:
      normalizeString(raw?.instagramUrl) || fallback.instagramUrl,
    aboutTitle:
      normalizeString(raw?.aboutTitle) || `Acerca de ${businessName}`,
    aboutText: normalizeString(raw?.aboutText) || fallback.aboutText,
    aboutImageUrl:
      normalizeString(raw?.aboutImageUrl) ||
      normalizeString(raw?.ogImageUrl) ||
      fallback.aboutImageUrl,
    createdAt: normalizeString(raw?.createdAt) || undefined,
    updatedAt: normalizeString(raw?.updatedAt) || undefined,
  };
};

export const getServerBusinessSettings = async (): Promise<BusinessSettings> => {
  const apiUrl = process.env.API_URL?.trim();
  if (!apiUrl) return fallbackSettings();

  try {
    const response = await fetch(`${apiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      cache: "no-store",
    });
    const payload = (await response.json()) as {
      data?: { businessSettings?: Partial<BusinessSettings> };
    };

    return normalizeSettings(payload.data?.businessSettings ?? null);
  } catch {
    return fallbackSettings();
  }
};
