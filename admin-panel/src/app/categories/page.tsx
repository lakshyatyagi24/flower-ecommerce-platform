'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { adminApi, AdminCategory, AdminCategoryInput, AdminProductType, AdminSaleMode, ApiError } from '@/lib/api';

const PRODUCT_TYPES: AdminProductType[] = ['CUT_FLOWER', 'PLANT', 'BOUQUET', 'ARRANGEMENT', 'HAMPER'];
const SALE_MODES: AdminSaleMode[] = ['PURCHASE', 'ENQUIRY'];

type FormState = {
  name: string;
  slug: string;
  image: string;
  description: string;
  parentId: string;
  productType: AdminProductType | '';
  defaultSaleMode: AdminSaleMode | '';
  defaultGstRate: string;
  sortOrder: string;
  active: boolean;
};

const blankForm = (): FormState => ({
  name: '',
  slug: '',
  image: '',
  description: '',
  parentId: '',
  productType: '',
  defaultSaleMode: '',
  defaultGstRate: '',
  sortOrder: '',
  active: true,
});

function flatten(list: AdminCategory[]): AdminCategory[] {
  const out: AdminCategory[] = [];
  const visit = (nodes: AdminCategory[]) => {
    nodes.forEach((n) => {
      out.push(n);
      if (n.children) visit(n.children);
    });
  };
  visit(list);
  return out;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [formData, setFormData] = useState<FormState>(blankForm());
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const { addToast } = useToast();

  const fetchCategories = useCallback(async () => {
    try {
      // Use the admin endpoint so inactive categories are visible too.
      const data = await adminApi.listCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      addToast({
        type: 'error',
        title: 'Error',
        description: error instanceof ApiError ? error.message : 'Failed to load categories.',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload: AdminCategoryInput = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      image: formData.image.trim() || null,
      description: formData.description.trim() || null,
      parentId: formData.parentId ? parseInt(formData.parentId, 10) : null,
      productType: formData.productType || undefined,
      defaultSaleMode: formData.defaultSaleMode || undefined,
      defaultGstRate: formData.defaultGstRate !== '' ? Number(formData.defaultGstRate) : undefined,
      sortOrder: formData.sortOrder !== '' ? Number(formData.sortOrder) : undefined,
      active: formData.active,
    };

    try {
      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.id, payload);
      } else {
        await adminApi.createCategory(payload);
      }
      await fetchCategories();
      setIsDialogOpen(false);
      resetForm();
      addToast({
        type: 'success',
        title: 'Success',
        description: `Category ${editingCategory ? 'updated' : 'created'} successfully.`,
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to save category.';
      // Friendlier hints for the most common backend errors.
      let title = 'Error';
      let description = message;
      if (/Unique constraint failed/i.test(message)) {
        title = 'Duplicate slug';
        description = 'A category with this slug already exists. Please choose a different slug.';
      } else if (/Maximum 8 main categories/i.test(message)) {
        title = 'Limit reached';
        description = 'You can only have a maximum of 8 main (top-level) categories.';
      }
      setIsDialogOpen(false);
      resetForm();
      setTimeout(() => {
        addToast({ type: 'error', title, description });
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(id);
    try {
      await adminApi.deleteCategory(id);
      await fetchCategories();
      addToast({ type: 'success', title: 'Success', description: 'Category deleted successfully.' });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        description: error instanceof ApiError ? error.message : 'Failed to delete category.',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const generateSlug = (name: string): string =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const resetForm = () => {
    setFormData(blankForm());
    setEditingCategory(null);
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: editingCategory ? formData.slug : generateSlug(name),
    });
  };

  const openEditDialog = (category: AdminCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      image: category.image || '',
      description: category.description || '',
      parentId: category.parentId?.toString() || '',
      productType: (category.productType as AdminProductType) || '',
      defaultSaleMode: (category.defaultSaleMode as AdminSaleMode) || '',
      defaultGstRate: category.defaultGstRate !== undefined && category.defaultGstRate !== null ? String(category.defaultGstRate) : '',
      sortOrder: category.sortOrder !== undefined && category.sortOrder !== null ? String(category.sortOrder) : '',
      active: category.active !== false,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryRow = (category: AdminCategory, level = 0): React.JSX.Element[] => {
    const hasChildren = !!category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const rows: React.JSX.Element[] = [];

    rows.push(
      <TableRow key={category.id} className={category.active === false ? 'opacity-60' : ''}>
        <TableCell>
          <div style={{ paddingLeft: `${level * 20}px` }} className="flex items-center">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(category.id)}
                className="mr-2 p-0 h-4 w-4"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
            ) : (
              <span className="inline-block w-4 mr-2" />
            )}
            <span>{category.name}</span>
            {category.active === false && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                Hidden
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">{category.slug}</TableCell>
        <TableCell>{category.productType ? category.productType.replace('_', ' ').toLowerCase() : '—'}</TableCell>
        <TableCell>{category.defaultSaleMode || '—'}</TableCell>
        <TableCell>{category.sortOrder ?? '—'}</TableCell>
        <TableCell>{category.image ? 'Yes' : 'No'}</TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => openEditDialog(category)}>
              <Edit className="h-3 w-3" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isDeleting === category.id}>
                  {isDeleting === category.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the category &ldquo;{category.name}&rdquo; and all its subcategories.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(category.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TableCell>
      </TableRow>,
    );

    if (hasChildren && isExpanded) {
      category.children!.forEach((child) => {
        rows.push(...renderCategoryRow(child, level + 1));
      });
    }

    return rows;
  };

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
  const allCategoriesFlat = flatten(categories).filter((c) => !editingCategory || c.id !== editingCategory.id);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage your flower categories, defaults and ordering.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Short copy used on category landing pages and SEO meta."
                />
              </div>
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  disabled={isSubmitting}
                  placeholder="https://…"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentId">Parent category</Label>
                  <select
                    id="parentId"
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full p-2 border rounded"
                    disabled={isSubmitting}
                  >
                    <option value="">— Top level —</option>
                    {allCategoriesFlat.map((category) => (
                      <option key={category.id} value={category.id.toString()}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="sortOrder">Sort order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="productType">Product type</Label>
                  <select
                    id="productType"
                    value={formData.productType}
                    onChange={(e) => setFormData({ ...formData, productType: e.target.value as AdminProductType | '' })}
                    className="w-full p-2 border rounded"
                    disabled={isSubmitting}
                  >
                    <option value="">— None —</option>
                    {PRODUCT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.replace('_', ' ').toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="defaultSaleMode">Default sale mode</Label>
                  <select
                    id="defaultSaleMode"
                    value={formData.defaultSaleMode}
                    onChange={(e) => setFormData({ ...formData, defaultSaleMode: e.target.value as AdminSaleMode | '' })}
                    className="w-full p-2 border rounded"
                    disabled={isSubmitting}
                  >
                    <option value="">— None —</option>
                    {SALE_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="defaultGstRate">Default GST (%)</Label>
                  <Input
                    id="defaultGstRate"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.defaultGstRate}
                    onChange={(e) => setFormData({ ...formData, defaultGstRate: e.target.value })}
                    disabled={isSubmitting}
                    placeholder="0"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  disabled={isSubmitting}
                />
                <span className="text-sm">Active (visible on storefront)</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Sale mode</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{categories.flatMap((category) => renderCategoryRow(category))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
