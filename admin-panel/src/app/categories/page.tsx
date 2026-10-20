'use client';

import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { flatten } from './category-form';
import { CategoriesTable } from './components/CategoriesTable';
import { CategoryFormDialog } from './components/CategoryFormDialog';
import { useCategories } from './useCategories';
import { useCategoryForm } from './useCategoryForm';

export default function CategoriesPage() {
  const { categories, loading, expanded, toggleExpanded, deletingId, handleDelete, fetchCategories } = useCategories();
  const form = useCategoryForm(fetchCategories);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading categories...</span>
      </div>
    );
  }

  // For the parent dropdown we want a flat list, but exclude the category being edited
  // (and its descendants — handled implicitly by the flat list).
  const editingId = form.editingCategory?.id;
  const categoriesFlat = flatten(categories).filter((c) => c.id !== editingId);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage your flower categories, defaults and ordering.</p>
        </div>
        <CategoryFormDialog state={form} categoriesFlat={categoriesFlat} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoriesTable
            categories={categories}
            expanded={expanded}
            deletingId={deletingId}
            onToggle={toggleExpanded}
            onEdit={form.openEditDialog}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
