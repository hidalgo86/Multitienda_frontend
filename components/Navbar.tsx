"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import {
  clearStoredSession,
  getCurrentUser,
  getStoredAuthToken,
  getStoredUser,
} from "@/services/users";
import { listAdminOrders } from "@/services/orders";
import { getBusinessSettings } from "@/services/business-settings";
import { RootState } from "@/store";
import { useCommerceSettings } from "@/lib/useCommerceSettings";
import {
  MdFavorite,
  MdShoppingCart,
  MdLogin,
  MdStore,
  MdHome,
  MdPerson,
  MdBarChart,
  MdInfo,
  MdReceiptLong,
} from "react-icons/md";

const navLinks = [
  { href: "/", icon: <MdHome />, label: "Inicio" },
  { href: "/products", icon: <MdStore />, label: "Productos" },
];

const isAdminRole = (role?: string | null): boolean =>
  role?.trim().toLowerCase() === "administrador";

export default function Navbar() {
  const pathname = usePathname();
  const cartCount = useSelector((state: RootState) => state.cart.totalItems);
  const favoritesCount = useSelector((state: RootState) =>
    state.favorites && Array.isArray(state.favorites.items)
      ? state.favorites.items.length
      : 0,
  );
  const [mounted, setMounted] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = React.useState(0);
  const [businessBrand, setBusinessBrand] = React.useState({
    name: "Tienda online",
    logoUrl: "/placeholder.webp",
  });
  const { paymentsEnabled } = useCommerceSettings();

  React.useEffect(() => {
    let isMounted = true;

    const syncAuthState = () => {
      setMounted(true);
      setIsAuthenticated(Boolean(getStoredAuthToken()));
      setIsAdmin(isAdminRole(getStoredUser()?.role));
    };

    const validateStoredSession = async () => {
      if (!getStoredAuthToken()) {
        syncAuthState();
        return;
      }

      try {
        await getCurrentUser();
        if (isMounted) {
          syncAuthState();
        }
      } catch {
        clearStoredSession();
        if (isMounted) {
          syncAuthState();
        }
      }
    };

    syncAuthState();
    void validateStoredSession();
    window.addEventListener("auth:session-changed", syncAuthState);
    window.addEventListener("focus", validateStoredSession);

    return () => {
      isMounted = false;
      window.removeEventListener("auth:session-changed", syncAuthState);
      window.removeEventListener("focus", validateStoredSession);
    };
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const loadBusinessBrand = async () => {
      try {
        const settings = await getBusinessSettings();
        if (isMounted) {
          setBusinessBrand({
            name: settings.businessName || "Tienda online",
            logoUrl: settings.logoUrl || "/placeholder.webp",
          });
        }
      } catch {
        if (isMounted) {
          setBusinessBrand({
            name: "Tienda online",
            logoUrl: "/placeholder.webp",
          });
        }
      }
    };

    void loadBusinessBrand();
    window.addEventListener("business-settings:updated", loadBusinessBrand);
    window.addEventListener("focus", loadBusinessBrand);

    return () => {
      isMounted = false;
      window.removeEventListener("business-settings:updated", loadBusinessBrand);
      window.removeEventListener("focus", loadBusinessBrand);
    };
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const loadPendingOrdersCount = async () => {
      if (!mounted || !isAdmin) {
        setPendingOrdersCount(0);
        return;
      }

      try {
        const response = await listAdminOrders({
          page: 1,
          limit: 1,
          status: "pending",
        });

        if (isMounted) {
          setPendingOrdersCount(Number(response.total) || 0);
        }
      } catch {
        if (isMounted) {
          setPendingOrdersCount(0);
        }
      }
    };

    void loadPendingOrdersCount();
    window.addEventListener("focus", loadPendingOrdersCount);
    window.addEventListener("auth:session-changed", loadPendingOrdersCount);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", loadPendingOrdersCount);
      window.removeEventListener("auth:session-changed", loadPendingOrdersCount);
    };
  }, [mounted, isAdmin]);

  const displayCart = mounted ? cartCount : 0;
  const displayFav = mounted ? favoritesCount : 0;
  const displayPendingOrders = mounted ? pendingOrdersCount : 0;
  const hasDesktopActions = !isAdmin || !isAuthenticated;
  const isDashboardPath = pathname.startsWith("/dashboard");
  const desktopNavLinks = [
    ...navLinks,
    ...(isAuthenticated && !isAdmin && paymentsEnabled
      ? [
          {
            href: "/orders",
            icon: <MdReceiptLong />,
            label: "Pedidos",
          },
        ]
      : []),
    ...(isAuthenticated
      ? [
          {
            href: "/account",
            icon: <MdPerson />,
            label: "Mi Cuenta",
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            href: "/dashboard/products",
            icon: <MdBarChart />,
            label: "Dashboard",
          },
        ]
      : []),
    { href: "/acerca", icon: <MdInfo />, label: "Acerca" },
  ];

  const isActivePath = React.useCallback(
    (href: string) => {
      if (href === "/") {
        return pathname === "/";
      }

      return pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname],
  );

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-brand-200 bg-brand-50/95 shadow-md backdrop-blur supports-[backdrop-filter]:bg-brand-50/90">
        <div className="relative flex h-20 w-full items-center justify-center overflow-hidden px-4 sm:h-20 sm:justify-between sm:px-5 lg:grid lg:h-20 lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)_auto] lg:gap-5 lg:px-6 xl:h-24 xl:grid-cols-[minmax(260px,350px)_minmax(0,1fr)_auto] xl:gap-7 xl:px-8">
          <Link
            href="/"
            className="flex min-w-0 flex-1 items-center justify-start overflow-hidden pr-14 sm:pr-0 lg:flex-none"
          >
            <Image
              src={businessBrand.logoUrl}
              alt={businessBrand.name}
              width={900}
              height={260}
              priority
              unoptimized={businessBrand.logoUrl.startsWith("/")}
              className="h-20 w-[300px] max-w-full object-contain object-left sm:w-[320px] md:w-[360px] lg:h-16 lg:w-[310px] xl:h-18 xl:w-[340px]"
            />
          </Link>

          {mounted && (
            <Link
              href={isAuthenticated ? "/account" : "/login"}
              title={isAuthenticated ? "Mi cuenta" : "Login"}
              className={`absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-brand-200 bg-white/90 shadow-sm transition-colors lg:hidden ${
                isActivePath(isAuthenticated ? "/account" : "/login")
                  ? "bg-brand-100 text-brand-700"
                  : "text-gray-600 hover:bg-brand-100 hover:text-brand-700"
              }`}
            >
              {isAuthenticated ? <MdPerson size={24} /> : <MdLogin size={24} />}
              {isAuthenticated && (
                <span
                  aria-label="Sesion activa"
                  className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-brand-50 bg-emerald-500"
                />
              )}
              <span className="sr-only">
                {isAuthenticated ? "Mi cuenta" : "Login"}
              </span>
            </Link>
          )}

          <div
            className={`hidden min-w-0 items-center justify-center gap-2 overflow-hidden pr-4 lg:flex xl:gap-3 xl:pr-6 ${
              hasDesktopActions ? "border-r border-brand-200" : ""
            }`}
          >
            {desktopNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex min-w-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors xl:gap-2 xl:px-3 xl:text-base ${
                  isActivePath(link.href)
                    ? "bg-brand-100 text-brand-800"
                    : "text-gray-700 hover:bg-brand-100 hover:text-brand-700"
                }`}
              >
                <span className="shrink-0 text-lg xl:text-xl">{link.icon}</span>
                <span className="truncate">{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="hidden shrink-0 items-center justify-end gap-2 lg:flex">
            {!isAdmin && (
              <>
                <Link
                  href="/favorites"
                  title="Favoritos"
                  className={`relative inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-colors ${
                    isActivePath("/favorites")
                      ? "border-brand-200 bg-brand-100 text-brand-700"
                      : "border-brand-200 bg-white/70 text-gray-700 hover:bg-brand-100 hover:text-brand-700"
                  }`}
                >
                  <MdFavorite
                    size={20}
                    className="shrink-0 text-brand-500"
                  />
                  <span>Favoritos</span>
                  {displayFav > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs text-white">
                      {displayFav}
                    </span>
                  )}
                </Link>

                <Link
                  href="/cart"
                  title="Carrito"
                  className={`relative inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-colors ${
                    isActivePath("/cart")
                      ? "border-brand-200 bg-brand-100 text-brand-700"
                      : "border-brand-200 bg-white/70 text-gray-700 hover:bg-brand-100 hover:text-brand-700"
                  }`}
                >
                  <MdShoppingCart
                    size={20}
                    className="shrink-0 text-brand-500"
                  />
                  <span>Carrito</span>
                  {displayCart > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs text-white">
                      {displayCart}
                    </span>
                  )}
                </Link>
              </>
            )}

            {!isAuthenticated && (
              <Link
                href="/login"
                title="Login"
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-sm font-medium transition-colors ${
                  isActivePath("/login")
                    ? "bg-slate-100 text-slate-900"
                    : "bg-white/70 text-gray-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <MdLogin
                  size={20}
                  className="shrink-0"
                />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {!isDashboardPath && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-200 bg-white shadow-lg lg:hidden">
          <div className="flex justify-around items-center py-2 px-2">
            <Link
              href="/"
              className={`flex min-w-0 flex-1 flex-col items-center rounded-lg px-1 py-2 transition-colors ${
                isActivePath("/")
                  ? "text-brand-700"
                  : "text-gray-600 hover:text-brand-600"
              }`}
            >
              <div
                className={`rounded-full p-2 transition-colors ${
                  isActivePath("/")
                    ? "bg-brand-100 text-brand-700"
                    : "hover:bg-brand-100"
                }`}
              >
                <MdHome size={20} />
              </div>
              <span
                className={`mt-1 w-full truncate text-center text-xs ${
                  isActivePath("/") ? "font-semibold" : "font-normal"
                }`}
              >
                Inicio
              </span>
            </Link>

          <Link
            href="/products"
            className={`flex min-w-0 flex-1 flex-col items-center rounded-lg px-1 py-2 transition-colors ${
              isActivePath("/products")
                ? "text-brand-700"
                : "text-gray-600 hover:text-brand-600"
            }`}
          >
            <div
              className={`rounded-full p-2 transition-colors ${
                isActivePath("/products")
                  ? "bg-brand-100 text-brand-700"
                  : "hover:bg-brand-100"
              }`}
            >
              <MdStore size={20} />
            </div>
            <span
              className={`mt-1 w-full truncate text-center text-xs ${
                isActivePath("/products") ? "font-semibold" : "font-normal"
              }`}
            >
              Productos
            </span>
          </Link>

          {!isAdmin && (
            <>
              <Link
                href="/favorites"
                className={`relative flex min-w-0 flex-1 flex-col items-center rounded-lg px-1 py-2 transition-colors ${
                  isActivePath("/favorites")
                    ? "text-brand-600"
                    : "text-gray-600 hover:text-brand-500"
                }`}
              >
                <div
                  className={`relative rounded-full p-2 transition-colors ${
                    isActivePath("/favorites")
                      ? "bg-brand-100 text-brand-600"
                      : "hover:bg-brand-100"
                  }`}
                >
                  <MdFavorite size={20} />
                  {displayFav > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {displayFav > 9 ? "9+" : displayFav}
                    </span>
                  )}
                </div>
                <span
                  className={`mt-1 w-full truncate text-center text-xs ${
                    isActivePath("/favorites") ? "font-semibold" : "font-normal"
                  }`}
                >
                  Favoritos
                </span>
              </Link>

              <Link
                href="/cart"
                className={`relative flex min-w-0 flex-1 flex-col items-center rounded-lg px-1 py-2 transition-colors ${
                  isActivePath("/cart")
                    ? "text-brand-700"
                    : "text-gray-600 hover:text-brand-600"
                }`}
              >
                <div
                  className={`relative rounded-full p-2 transition-colors ${
                    isActivePath("/cart")
                      ? "bg-brand-100 text-brand-700"
                      : "hover:bg-brand-100"
                  }`}
                >
                  <MdShoppingCart size={20} />
                  {displayCart > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs text-white">
                      {displayCart > 9 ? "9+" : displayCart}
                    </span>
                  )}
                </div>
                <span
                  className={`mt-1 w-full truncate text-center text-xs ${
                    isActivePath("/cart") ? "font-semibold" : "font-normal"
                  }`}
                >
                  Carrito
                </span>
              </Link>
            </>
          )}

          {isAdmin && (
            <>
              <Link
                href="/dashboard/orders"
                className={`relative flex min-w-0 flex-1 flex-col items-center rounded-lg px-1 py-2 transition-colors ${
                  isActivePath("/dashboard/orders")
                    ? "text-brand-700"
                    : "text-gray-600 hover:text-brand-600"
                }`}
              >
                <div
                  className={`relative rounded-full p-2 transition-colors ${
                    isActivePath("/dashboard/orders")
                      ? "bg-brand-100 text-brand-700"
                      : "hover:bg-brand-100"
                  }`}
                >
                  <MdReceiptLong size={20} />
                  {displayPendingOrders > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-semibold text-white">
                      {displayPendingOrders > 9 ? "9+" : displayPendingOrders}
                    </span>
                  )}
                </div>
                <span
                  className={`mt-1 w-full truncate text-center text-xs ${
                    isActivePath("/dashboard/orders")
                      ? "font-semibold"
                      : "font-normal"
                  }`}
                >
                  Ordenes
                </span>
              </Link>

              <Link
                href="/dashboard/products"
                className={`flex min-w-0 flex-1 flex-col items-center rounded-lg px-1 py-2 transition-colors ${
                  isActivePath("/dashboard/products")
                    ? "text-brand-700"
                    : "text-gray-600 hover:text-brand-600"
                }`}
              >
                <div
                  className={`rounded-full p-2 transition-colors ${
                    isActivePath("/dashboard/products")
                      ? "bg-brand-100 text-brand-700"
                      : "hover:bg-brand-100"
                  }`}
                >
                  <MdBarChart size={20} />
                </div>
                <span
                  className={`mt-1 w-full truncate text-center text-xs ${
                    isActivePath("/dashboard/products")
                      ? "font-semibold"
                      : "font-normal"
                  }`}
                >
                  Dashboard
                </span>
              </Link>
            </>
          )}

          {isAuthenticated && !isAdmin && paymentsEnabled && (
            <Link
              href="/orders"
              className={`flex min-w-0 flex-1 flex-col items-center rounded-lg px-1 py-2 transition-colors ${
                isActivePath("/orders")
                  ? "text-brand-700"
                  : "text-gray-600 hover:text-brand-600"
              }`}
            >
              <div
                className={`rounded-full p-2 transition-colors ${
                  isActivePath("/orders")
                    ? "bg-brand-100 text-brand-700"
                    : "hover:bg-brand-100"
                }`}
              >
                <MdReceiptLong size={20} />
              </div>
              <span
                className={`mt-1 w-full truncate text-center text-xs ${
                  isActivePath("/orders") ? "font-semibold" : "font-normal"
                }`}
              >
                Pedidos
              </span>
            </Link>
          )}
          </div>
        </div>
      )}
    </>
  );
}
