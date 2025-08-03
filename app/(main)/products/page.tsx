// lifesync/app/(main)/products/page.tsx

import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { ProductsLayout } from "@/components/products/ProductsLayout";
import ProductCard from "@/components/products/ProductCard";
import AddProductModal from "@/components/products/AddProductModal";
import { useUser } from "@clerk/nextjs";

export default function ProductsPage() {
  const { user } = useUser();
  const products = useQuery(api.queries.products.list, { userId: user?.id });
  const deleteProduct = useMutation(api.actions.products.delete);

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct({ id: productId });
      // يمكن إضافة إشعار بنجاح الحذف
    } catch (error) {
      console.error("Failed to delete product:", error);
      // معالجة الخطأ هنا
    }
  };

  if (!products) {
    return <div className="flex justify-center items-center h-screen">
      <span className="loading loading-spinner loading-lg"></span>
    </div>;
  }

  return (
    <ProductsLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Products</h1>
        <AddProductModal userId={user?.id} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onDelete={() => handleDelete(product._id)}
          />
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found. Add your first product!</p>
        </div>
      )}
    </ProductsLayout>
  );
}