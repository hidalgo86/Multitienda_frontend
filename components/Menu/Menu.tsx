"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaSearch } from "react-icons/fa";

const imagenes = [
  { src: "/menuCategoria/bebe3.png", alt: "Bebé" },
  { src: "/menuCategoria/nino.png", alt: "Niño" },
  { src: "/menuCategoria/nina.png", alt: "Niña" },
];

export default function Home() {
  const router = useRouter();

  return (
    <div
      className="hidden justify-center gap-x-26 bg-brand-300 pr-10 pl-10 sm:flex sm:pr-20 sm:pl-20 xl:pr-30 xl:pl-30"
    >
      {imagenes.map((img, idx) => (
        <div
          key={idx}
          className="flex flex-col items-center cursor-pointer"
          onClick={() => {
            if (img.alt === "Mi cuenta") {
              router.push("/dashboard");
            }
          }}
        >
          <Image src={img.src} alt={img.alt} width={60} height={60} />
          <span className="mt-1 mb-2 text-center">{img.alt}</span>
        </div>
      ))}
      <div
        className="mt-5 mb-5 flex items-center justify-center rounded-lg bg-white/80 px-3 py-2 hover:bg-brand-50"
        style={{ minWidth: 180 }}
      >
        <FaSearch
          size={22}
          className="mr-2 text-gray-700 transition-colors"
        />
        <input
          type="text"
          placeholder="Buscar"
          className="bg-transparent outline-none text-gray-700 placeholder-gray-400 w-full"
        />
      </div>
    </div>
  );
}
