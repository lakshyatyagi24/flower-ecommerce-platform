'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApi, AdminCategory } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { errorMessage } from '@/lib/error-message';

export function useCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { addToast } = useToast();

  const fetchCategories = useCallback(async () => {
    try {
      // Use the admin endpoint so inactive categories are visible too.
      setCategories(await adminApi.listCategories());
    } catch (error) {
      console.error('Error fetching categories:', error);
      addToast({ type: 'error', title: 'Error', description: errorMessage(error, 'Failed to load categories.') });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const toggleExpanded = (categoryId: number) => {
    const next = new Set(expanded);
    if (!next.delete(categoryId)) next.add(categoryId);
    setExpanded(next);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await adminApi.deleteCategory(id);
      await fetchCategories();
      addToast({ type: 'success', title: 'Success', description: 'Category deleted successfully.' });
    } catch (error) {
      addToast({ type: 'error', title: 'Error', description: errorMessage(error, 'Failed to delete category.') });
    } finally {
      setDeletingId(null);
    }
  };

  return { categories, loading, expanded, toggleExpanded, deletingId, handleDelete, fetchCategories };
}
