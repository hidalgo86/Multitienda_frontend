import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import ReduxProvider from "../components/ReduxProvider";
import BusinessThemeProvider from "@/components/providers/BusinessThemeProvider";
import { Toaster } from "sonner";
import { getServerBusinessSettings } from "@/lib/businessSettingsServer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const generateMetadata = async (): Promise<Metadata> => {
  const settings = await getServerBusinessSettings();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: settings.seoTitle,
      template: `%s | ${settings.businessName}`,
    },
    description: settings.seoDescription,
    openGraph: {
      title: settings.seoTitle,
      description: settings.seoDescription,
      url: "/",
      siteName: settings.businessName,
      images: [
        {
          url: settings.ogImageUrl,
          width: 1730,
          height: 909,
          alt: `${settings.businessName} tienda online`,
        },
      ],
      locale: "es_ES",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: settings.seoTitle,
      description: settings.seoDescription,
      images: [settings.ogImageUrl],
    },
    other: {
      google: "notranslate",
    },
  };
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="es"
      translate="no"
      data-scroll-behavior="smooth"
      className="notranslate"
      suppressHydrationWarning
    >
      <body nonce={nonce} suppressHydrationWarning>
        <BusinessThemeProvider>
          <ReduxProvider>{children}</ReduxProvider>
        </BusinessThemeProvider>
        <Toaster
          position="top-right"
          expand={true}
          richColors
          closeButton
          icons={{
            success: undefined,
            error: undefined,
            warning: undefined,
            info: undefined,
          }}
          toastOptions={{
            style: {
              fontSize: "14px",
              minWidth: "320px",
              maxWidth: "500px",
              padding: "16px",
            },
            className: "text-sm sm:text-base",
            duration: 4000,
            unstyled: false,
          }}
        />
      </body>
    </html>
  );
}
