import Link from "next/link";
import Image from "next/image";
import { FaInstagram } from "react-icons/fa";
import { MdLocalShipping, MdPayment, MdSupportAgent } from "react-icons/md";
import { getServerBusinessSettings } from "@/lib/businessSettingsServer";

const shopLinks = [
  { href: "/products", label: "Productos" },
  { href: "/favorites", label: "Favoritos" },
  { href: "/cart", label: "Carrito" },
  { href: "/acerca", label: "Acerca de nosotros" },
];

const serviceItems = [
  {
    Icon: MdLocalShipping,
    title: "Entrega",
    text: "Coordinacion sujeta a disponibilidad.",
  },
  {
    Icon: MdPayment,
    title: "Pago",
    text: "Confirmacion antes de preparar tu pedido.",
  },
  {
    Icon: MdSupportAgent,
    title: "Ayuda",
    text: "Consultas por redes sociales antes de comprar.",
  },
];

export default async function Footer() {
  const settings = await getServerBusinessSettings();
  const socialLinks = settings.instagramUrl
    ? [
        {
          href: settings.instagramUrl,
          label: `Instagram de ${settings.businessName}`,
          Icon: FaInstagram,
        },
      ]
    : [];

  return (
    <footer className="mb-20 mt-6 border-t border-brand-200 bg-brand-50 sm:mb-24 sm:mt-10 lg:mb-0 lg:mt-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-3 py-6 sm:grid-cols-2 sm:gap-8 sm:px-6 sm:py-10 lg:grid-cols-3 lg:gap-12 lg:px-8 lg:py-12">
        <div className="col-span-1 flex flex-col items-center sm:col-span-2 sm:items-start lg:col-span-1">
          <Image
            src={settings.logoUrl}
            alt={`Logo ${settings.businessName}`}
            width={600}
            height={180}
            unoptimized={settings.logoUrl.startsWith("/")}
            className="mb-3 h-20 w-[240px] max-w-full object-contain object-center sm:mb-4 sm:h-24 sm:w-[280px] lg:h-26 lg:w-[320px]"
          />
          <p className="max-w-xs text-center text-xs text-gray-600 sm:max-w-none sm:text-left sm:text-sm lg:text-base">
            {settings.seoDescription}
          </p>
        </div>

        <div className="flex flex-col items-center sm:items-start">
          <h3 className="mb-2 text-sm font-semibold text-gray-800 sm:mb-3 sm:text-base lg:mb-4 lg:text-lg">
            Tienda
          </h3>
          <nav className="flex flex-col items-center gap-2 text-sm text-gray-600 sm:items-start">
            {shopLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-brand-700"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-center sm:items-start">
          <h3 className="mb-2 text-sm font-semibold text-gray-800 sm:mb-3 sm:text-base lg:mb-4 lg:text-lg">
            Compra tranquila
          </h3>
          <div className="space-y-3">
            {serviceItems.map(({ Icon, title, text }) => (
              <div key={title} className="flex max-w-xs gap-3 text-left">
                <div className="mt-0.5 rounded-xl bg-brand-100 p-2 text-brand-700">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{title}</p>
                  <p className="text-xs leading-relaxed text-gray-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {socialLinks.length > 0 && (
          <div className="flex flex-col items-center sm:items-start lg:col-start-2">
            <h3 className="mb-2 text-sm font-semibold text-gray-800 sm:mb-3 sm:text-base lg:mb-4 lg:text-lg">
              Siguenos
            </h3>
            <div className="flex gap-3 text-brand-600 sm:gap-4 lg:gap-6">
              {socialLinks.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="rounded-full p-2 transition-all duration-200 hover:bg-brand-100 sm:p-1"
                >
                  <Icon className="size-5 transition-colors hover:text-brand-800 lg:size-6" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-brand-200 bg-brand-100 py-3 text-center text-xs text-gray-600 sm:py-4 sm:text-sm lg:py-5 lg:text-base">
        <p>
          &copy; {new Date().getFullYear()} {settings.businessName}. Todos los
          derechos reservados.
        </p>
      </div>
    </footer>
  );
}
