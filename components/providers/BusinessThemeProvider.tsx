"use client";

import React from "react";
import { getBusinessSettings } from "@/services/business-settings";
import { applyBrandPalette } from "@/lib/brandPalettes";

export default function BusinessThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    let isMounted = true;

    const loadTheme = async () => {
      try {
        const settings = await getBusinessSettings();
        if (isMounted) {
          applyBrandPalette(settings.colorPalette);
        }
      } catch {
        applyBrandPalette();
      }
    };

    void loadTheme();
    window.addEventListener("business-settings:updated", loadTheme);

    return () => {
      isMounted = false;
      window.removeEventListener("business-settings:updated", loadTheme);
    };
  }, []);

  return <>{children}</>;
}
