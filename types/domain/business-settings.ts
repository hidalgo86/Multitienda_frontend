export interface BusinessExtraField {
  label: string;
  value: string;
}

export interface BusinessSettings {
  id?: string;
  businessName: string;
  legalName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  logoUrl: string;
  logoPublicId?: string | null;
  extraFields: BusinessExtraField[];
  colorPalette: BusinessColorPalette;
  paymentsEnabled: boolean;
  checkoutDisabledMessage: string;
  storePickupAddress: string;
  pickupMessage: string;
  deliveryEnabled: boolean;
  deliveryDisabledMessage: string;
  manualPaymentInstructions: string[];
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string;
  instagramUrl: string;
  aboutTitle: string;
  aboutText: string;
  aboutImageUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessColorPalette {
  preset: string;
  brand50: string;
  brand100: string;
  brand200: string;
  brand300: string;
  brand400: string;
  brand500: string;
  brand600: string;
  brand700: string;
  brand800: string;
  brand900: string;
  brand950: string;
}

export type UpdateBusinessSettingsInput = Partial<
  Omit<BusinessSettings, "id" | "createdAt" | "updatedAt">
>;
