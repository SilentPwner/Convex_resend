// app/(main)/products/page.tsx
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProductCard from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";

export default function ProductsPage() {
  const featuredProducts = useQuery(api.productsQueries.getFeaturedProducts, {
    limit: 4,
  });
  const donationProducts = useQuery(api.productsQueries.getProductsByCategory, {
    category: "donation",
  });

  if (!featuredProducts || !donationProducts) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-8">
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">منتجات مميزة</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">فرص التبرع</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {donationProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}