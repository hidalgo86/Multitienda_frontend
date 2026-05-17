"use client";

import React, { Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import SidebarDesktop, {
  SidebarItem,
} from "../../components/products/SidebarDesktop";
import SidebarMobile from "../../components/products/SidebarMobile";
import {
  COOKIE_SESSION_MARKER,
  clearStoredSession,
  getCurrentUser,
  getStoredAuthToken,
  getStoredUser,
  updateStoredUser,
} from "@/services/users";
import {
  MdAssignment,
  MdGroups,
  MdInventory2,
  MdManageSearch,
  MdSettings,
} from "react-icons/md";

const isAdminRole = (role?: string | null): boolean =>
  role?.trim().toLowerCase() === "administrador";

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAllowed, setIsAllowed] = React.useState<boolean | null>(null);
  const hasShownSessionExpiredRef = React.useRef(false);
  const isRedirectingRef = React.useRef(false);

  const dashboardItems: SidebarItem[] = [
    {
      alt: "products",
      label: "Productos",
      href: "/dashboard/products",
      Icon: MdInventory2,
    },
    {
      alt: "clients",
      label: "Clientes",
      href: "/dashboard/clients",
      Icon: MdGroups,
    },
    {
      alt: "orders",
      label: "Ordenes",
      href: "/dashboard/orders",
      Icon: MdAssignment,
    },
    {
      alt: "audit",
      label: "Auditorias",
      href: "/dashboard/audit",
      Icon: MdManageSearch,
    },
    {
      alt: "settings",
      label: "Negocio",
      href: "/dashboard/settings",
      Icon: MdSettings,
    },
  ];
  const activeOption = React.useMemo(() => {
    if (pathname.includes("/dashboard/clients")) return "clients";
    if (pathname.includes("/dashboard/orders")) return "orders";
    if (pathname.includes("/dashboard/audit")) return "audit";
    if (pathname.includes("/dashboard/settings")) return "settings";
    return "products";
  }, [pathname]);

  React.useEffect(() => {
    let isMounted = true;

    const redirectToLogin = (showToast: boolean) => {
      if (isRedirectingRef.current) return;
      isRedirectingRef.current = true;

      if (isMounted) {
        setIsAllowed(false);
      }

      clearStoredSession();

      if (showToast && !hasShownSessionExpiredRef.current) {
        toast.error("Tu sesion ha expirado. Vuelve a iniciar sesion.");
        hasShownSessionExpiredRef.current = true;
      }

      if (isMounted) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    };

    const validateSession = async (showToastOnExpire: boolean) => {
      const restoreCookieSession = async () => {
        const currentUser = await getCurrentUser({
          token: COOKIE_SESSION_MARKER,
        });

        if (!isMounted) return;

        if (!isAdminRole(currentUser?.role)) {
          redirectToLogin(false);
          return;
        }

        updateStoredUser(currentUser);
        hasShownSessionExpiredRef.current = false;
        setIsAllowed(true);
      };

      const token = getStoredAuthToken();
      const user = getStoredUser();
      const isAdmin = Boolean(token) && isAdminRole(user?.role);

      if (!isAdmin) {
        try {
          await restoreCookieSession();
        } catch {
          redirectToLogin(false);
        }
        return;
      }

      try {
        const currentUser = await getCurrentUser();

        if (!isMounted) return;

        if (!isAdminRole(currentUser?.role)) {
          redirectToLogin(false);
          return;
        }

        hasShownSessionExpiredRef.current = false;
        setIsAllowed(true);
      } catch {
        redirectToLogin(showToastOnExpire);
      }
    };

    const handleSessionChanged = () => {
      void validateSession(false);
    };

    const handleFocus = () => {
      void validateSession(true);
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === "authToken" ||
        event.key === "refreshToken" ||
        event.key === "userData"
      ) {
        void validateSession(false);
      }
    };

    void validateSession(false);
    window.addEventListener("auth:session-changed", handleSessionChanged);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);

    return () => {
      isMounted = false;
      window.removeEventListener("auth:session-changed", handleSessionChanged);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, [pathname, router]);

  if (isAllowed !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-brand-500" />
          <p className="mt-4 text-sm font-medium text-gray-600">
            Preparando dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex flex-1 w-full min-w-0">
        <SidebarDesktop items={dashboardItems} activeOption={activeOption} />
        <main className="min-w-0 flex-1 bg-white px-3 py-4 pb-20 sm:px-6 sm:py-6 sm:pb-24 lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </main>
      </div>
      <SidebarMobile items={dashboardItems} activeOption={activeOption} />
    </div>
  );
}
