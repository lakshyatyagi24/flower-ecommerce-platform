"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, AdminCategory, AdminProduct } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { errorMessage } from "@/lib/error-message";

export function useProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const { addToast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [productList, cats] = await Promise.all([
        adminApi.listProducts({ active: undefined, take: 200 }),
        adminApi.listCategories(),
      ]);
      setProducts(productList.items);
      setCategories(cats);
    } catch (err) {
      addToast({ type: "error", title: "Error", description: errorMessage(err, "Failed to load products") });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await adminApi.deleteProduct(id);
      addToast({ type: "success", title: "Deleted", description: "Product removed." });
      fetchAll();
    } catch (err) {
      addToast({ type: "error", title: "Error", description: errorMessage(err, "Delete failed") });
    } finally {
      setDeleting(null);
    }
  };

  return { products, categories, loading, deleting, fetchAll, handleDelete };
}
