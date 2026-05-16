"use client";

import React from "react";
import { getCommerceSettingsFromBusiness, defaultCommerceSettings } from "./commerceConfig";
import type { CommerceSettings } from "./commerceConfig";
import { getBusinessSettings } from "@/services/business-settings";

export const useCommerceSettings = (): CommerceSettings => {
  const [commerceSettings, setCommerceSettings] =
    React.useState<CommerceSettings>(defaultCommerceSettings);

  React.useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const settings = await getBusinessSettings();
        if (isMounted) {
          setCommerceSettings(getCommerceSettingsFromBusiness(settings));
        }
      } catch {
        if (isMounted) {
          setCommerceSettings(defaultCommerceSettings);
        }
      }
    };

    void loadSettings();
    window.addEventListener("business-settings:updated", loadSettings);
    window.addEventListener("focus", loadSettings);

    return () => {
      isMounted = false;
      window.removeEventListener("business-settings:updated", loadSettings);
      window.removeEventListener("focus", loadSettings);
    };
  }, []);

  return commerceSettings;
};
