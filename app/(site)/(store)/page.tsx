import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Carrusel from "@/components/Carrusel/Carrusel";
import Cards from "@/components/Cards/Cards";
import RecentlyViewedProducts from "@/components/products/RecentlyViewedProducts";
import { listProducts } from "@/services/products";
import { listCategories } from "@/services/categories";
import { listPublicBanners } from "@/services/banners";
import {
  ProductAvailability,
  ProductSortBy,
} from "@/types/domain/products";
import { getRequestBaseUrl } from "@/lib/requestBaseUrl";
import {
  MdLocalShipping,
  MdPayments,
  MdStorefront,
  MdVerified,
} from "react-icons/md";
import { getServerBusinessSettings } from "@/lib/businessSettingsServer";
import { paginationConfig } from "@/lib/paginationConfig";

export const generateMetadata = async (): Promise<Metadata> => {
  const settings = await getServerBusinessSettings();

  return {
    title: settings.seoTitle,
    description: settings.seoDescription,
    alternates: {
      canonical: "/",
    },
  };
};

const getTrustItems = (pickupMessage: string) => [
  {
    label: "Retiro en tienda",
    description: pickupMessage,
    Icon: MdStorefront,
  },
  {
    label: "Pago flexible",
    description: "Transferencia, deposito o efectivo al retirar.",
    Icon: MdPayments,
  },
  {
    label: "Stock reservado",
    description: "Tu pedido queda reservado mientras confirmas el pago.",
    Icon: MdVerified,
  },
  {
    label: "Atencion cercana",
    description: "Te ayudamos con tallas, dudas y disponibilidad.",
    Icon: MdLocalShipping,
  },
];

export default async function Home() {
  const baseUrl = await getRequestBaseUrl();
  const settings = await getServerBusinessSettings();
  const trustItems = getTrustItems(settings.pickupMessage);
  const [newestProducts, categories, banners] = await Promise.all([
    listProducts(
      {
        page: 1,
        limit: paginationConfig.homeSectionLimit,
        availability: ProductAvailability.DISPONIBLE,
        sortBy: ProductSortBy.NEWEST,
      },
      { baseUrl, cache: "no-store" },
    )
      .then((response) => response.items ?? [])
      .catch(() => []),
    listCategories({ baseUrl, cache: "force-cache" }).catch(() => []),
    listPublicBanners({ baseUrl, cache: "force-cache" }).catch(() => []),
  ]);
  const visibleCategories = categories
    .filter((category) => category.isFeatured)
    .sort(
      (first, second) =>
        (first.displayOrder ?? 0) - (second.displayOrder ?? 0) ||
        first.name.localeCompare(second.name),
    );
  const fallbackCategories = categories
    .sort(
      (first, second) =>
        Number(Boolean(second.imageUrl)) - Number(Boolean(first.imageUrl)) ||
        (first.displayOrder ?? 0) - (second.displayOrder ?? 0) ||
        first.name.localeCompare(second.name),
    );
  const categoryLinks = (visibleCategories.length > 0
    ? visibleCategories
    : fallbackCategories
  )
    .sort(
      (first, second) =>
        (first.displayOrder ?? 0) - (second.displayOrder ?? 0) ||
        first.name.localeCompare(second.name),
    )
    .slice(0, 4)
    .map((category) => ({
      label: category.name,
      description: category.description || "Explora esta categoria.",
      href: `/products?categoryId=${encodeURIComponent(category.id)}`,
      imageUrl: category.imageUrl || "/placeholder.webp",
    }));

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-3 pb-24 pt-4 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8 lg:pb-6 lg:pt-8">
        <h1 className="sr-only">
          {settings.seoTitle}
        </h1>

        <div className="mt-2 sm:mt-4 lg:mt-0">
          <Carrusel initialBanners={banners} />
        </div>

        <section
          className="mt-8 sm:mt-10 lg:mt-12"
          aria-labelledby="home-categories"
        >
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2
                id="home-categories"
                className="text-xl font-bold text-slate-900 sm:text-2xl lg:text-3xl"
              >
                Compra por categoria
              </h2>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                Entra directo a lo que estas buscando.
              </p>
            </div>
            <Link
              href="/products"
              className="hidden rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
            >
              Ver catalogo
            </Link>
          </div>

          {categoryLinks.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {categoryLinks.map(({ label, description, href, imageUrl }) => (
                <Link
                  key={label}
                  href={href}
                  className="group overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-brand-50">
                    <Image
                      src={imageUrl}
                      alt={label}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="text-base font-bold text-slate-950">
                      {label}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 sm:text-sm">
                      {description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <section className="mt-8 rounded-lg border border-brand-100 bg-brand-50 p-4 sm:mt-10 sm:p-5 lg:mt-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map(({ label, description, Icon }) => (
              <div key={label} className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 shadow-sm">
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950">{label}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 mt-8 sm:mb-12 sm:mt-12 lg:mb-16 lg:mt-16">
          <Cards
            initialProducts={newestProducts}
            title="Novedades"
            description="Los ultimos productos agregados a la tienda."
            ctaLabel="Ver novedades"
            ctaHref={`/products?sortBy=${ProductSortBy.NEWEST}`}
            sortBy={ProductSortBy.NEWEST}
          />
        </section>

        <RecentlyViewedProducts />
      </main>
    </div>
  );
}
