"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductFormDialog } from "./components/ProductFormDialog";
import { ProductsTable } from "./components/ProductsTable";
import { useProductForm } from "./useProductForm";
import { useProducts } from "./useProducts";

export default function ProductsPage() {
  const { products, categories, loading, deleting, fetchAll, handleDelete } = useProducts();
  const formState = useProductForm(fetchAll);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your flower products</p>
        </div>
        <ProductFormDialog state={formState} categories={categories} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All products ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <p className="text-muted-foreground text-sm">No products yet. Click &quot;Add Product&quot; to create one.</p>
          ) : (
            <ProductsTable products={products} deleting={deleting} onEdit={formState.openEdit} onDelete={handleDelete} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
