import Link from "next/link";
import Image from "next/image";
import { FaInstagram } from "react-icons/fa";
import { MdLocalShipping, MdPayment, MdSupportAgent } from "react-icons/md";

const socialLinks = [
  {
    href: "https://instagram.com/chikitoslandia",
    label: "Siguenos en Instagram",
    Icon: FaInstagram,
  },
];

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
    text: "Coordinación sujeta a disponibilidad.",
  },
  {
    Icon: MdPayment,
    title: "Pago",
    text: "Confirmación antes de preparar tu pedido.",
  },
  {
    Icon: MdSupportAgent,
    title: "Ayuda",
    text: "Consultas por Instagram antes de comprar.",
  },
];

export default function Footer() {
  return (
    <footer
      className="border-t border-brand-200 bg-brand-50 
                       mt-6 sm:mt-10 lg:mt-16 
                       mb-20 sm:mb-24 lg:mb-0"
    >
      <div
        className="max-w-7xl mx-auto 
                      grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-12
                      px-3 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12"
      >
        <div
          className="col-span-1 flex flex-col items-center 
                        sm:col-span-2 sm:items-start lg:col-span-1"
        >
          <Image
            src="/chikitoslandia.png"
            alt="Logo ChikitosLandia"
            width={600}
            height={180}
            unoptimized
            className="mb-3 h-20 w-[240px] max-w-full object-cover object-center sm:mb-4 sm:h-24 sm:w-[280px] lg:h-26 lg:w-[320px]"
          />
          <p
            className="max-w-xs text-center text-xs text-gray-600 
                        sm:max-w-none sm:text-left sm:text-sm lg:text-base"
          >
            ChikitosLandia. Ropa tierna y cómoda para los más pequeños de la
            casa.
          </p>
        </div>

        <div className="flex flex-col items-center sm:items-start">
          <h3
            className="mb-2 text-sm font-semibold text-gray-800 
                         sm:mb-3 sm:text-base lg:mb-4 lg:text-lg"
          >
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
          <h3
            className="mb-2 text-sm font-semibold text-gray-800 
                         sm:mb-3 sm:text-base lg:mb-4 lg:text-lg"
          >
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

        <div className="flex flex-col items-center sm:items-start lg:col-start-2">
          <h3
            className="mb-2 text-sm font-semibold text-gray-800 
                         sm:mb-3 sm:text-base lg:mb-4 lg:text-lg"
          >
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
      </div>

      <div
        className="border-t border-brand-200 bg-brand-100 py-3 text-center text-xs text-gray-600
                      sm:py-4 sm:text-sm lg:py-5 lg:text-base"
      >
        <p>
          © {new Date().getFullYear()} ChikitosLandia. Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  );
}
