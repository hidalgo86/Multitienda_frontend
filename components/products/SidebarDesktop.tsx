import Link from "next/link";
import React from "react";
import type { SidebarDesktopProps, SidebarItem } from "@/types/ui/products";

export type { SidebarItem };

const SidebarDesktop: React.FC<SidebarDesktopProps> = ({
  items,
  activeOption,
}) => (
  <aside className="hidden w-full max-w-xs min-w-[230px] border-r border-gray-200 bg-white p-4 lg:block xl:min-w-[250px] xl:p-5">
    <div className="flex flex-col items-center justify-start w-full h-full gap-4 lg:gap-6 pt-4">
      {items.map((item, idx) => {
        const Icon = item.Icon;

        return (
        <Link
          key={idx}
          href={item.href}
          className={`flex flex-col items-center w-full p-2 lg:p-3 rounded-lg transition-all duration-200 ${
            activeOption === item.alt
              ? "bg-brand-100 text-brand-700 font-semibold shadow-sm"
              : "hover:bg-gray-100 text-gray-700 hover:shadow-sm"
          }`}
        >
          <div className="flex flex-col items-center">
            <Icon className="mb-1 h-8 w-8 lg:mb-2 lg:h-9 lg:w-9 xl:h-10 xl:w-10" aria-hidden />
            <span className="text-xs lg:text-sm text-center leading-tight">
              {item.label}
            </span>
          </div>
        </Link>
        );
      })}
    </div>
  </aside>
);

export default SidebarDesktop;
