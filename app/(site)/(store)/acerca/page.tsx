import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FaInstagram } from "react-icons/fa";
import {
  MdLocationOn,
  MdLocalShipping,
  MdPayments,
  MdStorefront,
  MdSupportAgent,
  MdVerified,
} from "react-icons/md";
import { getServerBusinessSettings } from "@/lib/businessSettingsServer";

export const generateMetadata = async (): Promise<Metadata> => {
  const settings = await getServerBusinessSettings();

  return {
    title: settings.aboutTitle,
    description: settings.aboutText,
    alternates: {
      canonical: "/acerca",
    },
    openGraph: {
      title: settings.aboutTitle,
      description: settings.aboutText,
      url: "/acerca",
      type: "website",
      images: [settings.aboutImageUrl],
    },
  };
};

const highlights = [
  {
    Icon: MdStorefront,
    title: "Tienda cercana",
    text: "Productos seleccionados para comprar con confianza y sin complicarte.",
  },
  {
    Icon: MdSupportAgent,
    title: "Atencion directa",
    text: "Te ayudamos con disponibilidad, dudas y detalles antes de preparar tu compra.",
  },
  {
    Icon: MdLocalShipping,
    title: "Entrega coordinada",
    text: "Retiro o entrega segun la configuracion y disponibilidad del negocio.",
  },
];

const values = [
  "Productos revisados antes de entregar",
  "Confirmacion de pago antes de preparar pedidos",
  "Comunicacion directa por redes sociales",
  "Catalogo pensado para comprar de forma simple",
];

export default async function AcercaPage() {
  const settings = await getServerBusinessSettings();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main>
        <section className="relative overflow-hidden bg-brand-50">
          <div className="grid min-h-[520px] lg:grid-cols-[minmax(0,1fr)_minmax(420px,560px)]">
            <div className="flex flex-col justify-center px-5 py-12 sm:px-8 lg:px-12 xl:px-16">
              <div className="max-w-3xl">
                <h1 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  {settings.aboutTitle}
                </h1>
                <p className="mt-5 max-w-2xl whitespace-pre-line text-base leading-7 text-slate-700 sm:text-lg">
                  {settings.aboutText}
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
                  >
                    Ver productos
                  </Link>
                  {settings.instagramUrl ? (
                    <Link
                      href={settings.instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
                    >
                      <FaInstagram size={20} />
                      Instagram
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="relative flex min-h-[300px] items-center justify-center bg-white p-4 sm:p-6 lg:min-h-full lg:p-8">
              <Image
                src={settings.aboutImageUrl}
                alt={settings.aboutTitle}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                unoptimized={settings.aboutImageUrl.startsWith("/")}
                className="object-contain object-center"
              />
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="grid gap-px bg-slate-200 sm:grid-cols-3">
            {highlights.map(({ Icon, title, text }) => (
              <div key={title} className="bg-white px-5 py-7 sm:px-8">
                <div className="mb-4 inline-flex rounded-lg bg-brand-100 p-3 text-brand-700">
                  <Icon size={24} />
                </div>
                <h2 className="text-lg font-bold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-5 py-10 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-brand-100 p-3 text-brand-700">
                  <MdLocationOn size={26} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">
                    Ubicacion
                  </h2>
                  <p className="mt-3 text-base leading-7 text-slate-700">
                    {settings.address || settings.storePickupAddress}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <MdPayments className="text-brand-700" size={24} />
                <h2 className="text-xl font-bold text-slate-950">
                  Compra tranquila
                </h2>
              </div>
              <ul className="mt-5 space-y-3">
                {values.map((value) => (
                  <li key={value} className="flex gap-3 text-sm text-slate-700">
                    <MdVerified className="mt-0.5 shrink-0 text-emerald-600" />
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
