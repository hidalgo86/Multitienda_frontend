import Link from "next/link";
import React from "react";
import type { SidebarMobileProps } from "@/types/ui/products";

const SidebarMobile: React.FC<SidebarMobileProps> = ({
  items,
  activeOption,
}) => (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg lg:hidden">
    <div
      className="grid gap-1 py-2 px-2 safe-area-inset-bottom"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item, idx) => {
        const Icon = item.Icon;

        return (
        <Link
          key={idx}
          href={item.href}
          className={`flex flex-col items-center py-2 px-1 rounded-lg transition-all duration-200 ${
            activeOption === item.alt
              ? "text-brand-700"
              : "text-gray-600 active:text-gray-900 hover:text-gray-800"
          }`}
        >
          <div
            className={`p-1.5 rounded-full transition-colors ${
              activeOption === item.alt
                ? "bg-brand-100"
                : "hover:bg-gray-100 active:bg-gray-200"
            }`}
          >
            <Icon className="h-5 w-5 flex-shrink-0" aria-hidden />
          </div>
          <span
            className={`text-xs mt-1 text-center truncate w-full leading-tight ${
              activeOption === item.alt ? "font-semibold" : "font-normal"
            }`}
          >
            {item.label}
          </span>
        </Link>
        );
      })}
    </div>
  </div>
);

export default SidebarMobile;
