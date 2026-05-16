import type { BusinessSettings } from "@/types/domain/business-settings";
import {
  defaultCheckoutDisabledMessage,
  defaultDeliveryDisabledMessage,
  defaultManualPaymentInstructions,
} from "@/services/business-settings";

export interface CommerceSettings {
  paymentsEnabled: boolean;
  checkoutDisabledMessage: string;
  paymentsDisabledMessage: string;
  storePickupAddress: string;
  pickupMessage: string;
  deliveryEnabled: boolean;
  deliveryDisabledMessage: string;
  manualPaymentInstructions: string[];
}

export const defaultCommerceSettings: CommerceSettings = {
  paymentsEnabled: true,
  checkoutDisabledMessage: defaultCheckoutDisabledMessage,
  paymentsDisabledMessage: defaultCheckoutDisabledMessage,
  storePickupAddress: "",
  pickupMessage: "Retiro en tienda disponible.",
  deliveryEnabled: false,
  deliveryDisabledMessage: defaultDeliveryDisabledMessage,
  manualPaymentInstructions: defaultManualPaymentInstructions,
};

export const getCommerceSettingsFromBusiness = (
  settings?: BusinessSettings | null,
): CommerceSettings => {
  if (!settings) return defaultCommerceSettings;

  return {
    paymentsEnabled: settings.paymentsEnabled,
    checkoutDisabledMessage: settings.checkoutDisabledMessage,
    paymentsDisabledMessage: settings.checkoutDisabledMessage,
    storePickupAddress: settings.storePickupAddress || settings.address,
    pickupMessage: settings.pickupMessage,
    deliveryEnabled: settings.deliveryEnabled,
    deliveryDisabledMessage: settings.deliveryDisabledMessage,
    manualPaymentInstructions: settings.manualPaymentInstructions.length
      ? settings.manualPaymentInstructions
      : defaultManualPaymentInstructions,
  };
};
