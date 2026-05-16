import type { Metadata } from "next";
import Link from "next/link";
import Carrusel from "../../../components/Carrusel/Carrusel";
import ClientCards from "../../../components/ClientCards";
import RecentlyViewedProducts from "@/components/products/RecentlyViewedProducts";
import { listProducts } from "@/services/products";
import {
  ProductAvailability,
  ProductSortBy,
} from "@/types/domain/products";
import { getRequestBaseUrl } from "@/lib/requestBaseUrl";
import {
  MdChildCare,
  MdFavorite,
  MdLocalShipping,
  MdPayments,
  MdRestaurant,
  MdStorefront,
  MdToys,
  MdVerified,
} from "react-icons/md";

export const metadata: Metadata = {
  title: "Ropa, juguetes y articulos para bebes y ninos",
  description:
    "Compra ropa, juguetes y articulos para bebes y ninos en Chikitoslandia.",
  alternates: {
    canonical: "/",
  },
};

const categoryIdBySlug = {
  ropa: process.env.NEXT_PUBLIC_CATEGORY_ID_ROPA,
  juguete: process.env.NEXT_PUBLIC_CATEGORY_ID_JUGUETE,
  accesorio: process.env.NEXT_PUBLIC_CATEGORY_ID_ACCESORIO,
  alimentacion: process.env.NEXT_PUBLIC_CATEGORY_ID_ALIMENTACION,
};

const getCategoryHref = (slug: keyof typeof categoryIdBySlug) => {
  const categoryId = categoryIdBySlug[slug]?.trim();
  return categoryId
    ? `/products?categoryId=${encodeURIComponent(categoryId)}`
    : `/products?category=${slug}`;
};

const categoryLinks = [
  {
    label: "Ropa",
    description: "Prendas comodas para bebes, ninos y ninas.",
    href: getCategoryHref("ropa"),
    Icon: MdChildCare,
    accent: "bg-rose-50 text-rose-700 border-rose-100",
  },
  {
    label: "Juguetes",
    description: "Ideas para regalar, aprender y jugar.",
    href: getCategoryHref("juguete"),
    Icon: MdToys,
    accent: "bg-sky-50 text-sky-700 border-sky-100",
  },
  {
    label: "Accesorios",
    description: "Detalles utiles para el dia a dia.",
    href: getCategoryHref("accesorio"),
    Icon: MdFavorite,
    accent: "bg-violet-50 text-violet-700 border-violet-100",
  },
  {
    label: "Alimentacion",
    description: "Articulos pensados para comer mejor.",
    href: getCategoryHref("alimentacion"),
    Icon: MdRestaurant,
    accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
];

const trustItems = [
  {
    label: "Retiro en tienda",
    description: "Coordina tu compra y retirala en Guiria.",
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
  const [featuredProducts, newestProducts] = await Promise.all([
    listProducts(
      {
        page: 1,
        limit: 4,
        availability: ProductAvailability.DISPONIBLE,
        sortBy: ProductSortBy.MOST_FAVORITED,
      },
      { baseUrl, cache: "no-store" },
    )
      .then((response) => response.items ?? [])
      .catch(() => []),
    listProducts(
      {
        page: 1,
        limit: 4,
        availability: ProductAvailability.DISPONIBLE,
        sortBy: ProductSortBy.NEWEST,
      },
      { baseUrl, cache: "no-store" },
    )
      .then((response) => response.items ?? [])
      .catch(() => []),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-3 pb-24 pt-4 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8 lg:pb-6 lg:pt-8">
        <h1 className="sr-only">
          Chikitoslandia, tienda online de ropa, juguetes y articulos para
          bebes y ninos
        </h1>

        <div className="mt-2 sm:mt-4 lg:mt-0">
          <Carrusel />
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

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {categoryLinks.map(({ label, description, href, Icon, accent }) => (
              <Link
                key={label}
                href={href}
                className={`group rounded-lg border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${accent}`}
              >
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white/80">
                  <Icon size={24} />
                </div>
                <h3 className="text-base font-bold">{label}</h3>
                <p className="mt-1 text-xs leading-5 opacity-80 sm:text-sm">
                  {description}
                </p>
              </Link>
            ))}
          </div>
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
          <ClientCards
            initialProducts={newestProducts}
            title="Novedades"
            description="Los ultimos productos agregados a la tienda."
            ctaLabel="Ver novedades"
            ctaHref={`/products?sortBy=${ProductSortBy.NEWEST}`}
            sortBy={ProductSortBy.NEWEST}
          />
        </section>

        <RecentlyViewedProducts />

        <section className="mb-8 mt-8 sm:mb-12 sm:mt-12 lg:mb-16 lg:mt-16">
          <ClientCards
            initialProducts={featuredProducts}
            title="Favoritos de la tienda"
            description="Productos que vale la pena mirar antes de decidir."
            ctaLabel="Ver todos"
            ctaHref="/products"
            sortBy={ProductSortBy.MOST_FAVORITED}
          />
        </section>
      </main>
    </div>
  );
}
