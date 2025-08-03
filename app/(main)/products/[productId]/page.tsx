// app/(main)/products/[productId]/page.tsx
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProductDetails from "@/components/products/ProductDetails";
import RelatedProducts from "@/components/products/RelatedProducts";

export default function ProductPage({ params }: { params: { productId: string } }) {
  const product = useQuery(api.productsQueries.getProductById, {
    productId: params.productId,
  });
  const relatedProducts = useQuery(api.productsQueries.getRelatedProducts, {
    productId: params.productId,
  });

  if (!product || !relatedProducts) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-8">
      <ProductDetails product={product} />
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}