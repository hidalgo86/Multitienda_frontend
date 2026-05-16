import React from "react";
import type { ProductListPublicProps } from "@/types/ui/products";
import ProductCardPublic from "./productCardPublic";

const ProductListPublic: React.FC<ProductListPublicProps> = ({
  products,
  onAddToCart,
  onFavorite,
}) => {
  if (!products || products.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
        No hay productos para mostrar.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCardPublic
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onFavorite={onFavorite}
        />
      ))}
    </div>
  );
};

export default ProductListPublic;
