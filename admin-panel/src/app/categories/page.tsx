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

interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string;
  parentId?: number;
  children?: Category[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    image: '',
    parentId: '',
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const { addToast } = useToast();

  const fetchCategories = useCallback(async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/categories`);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load categories. Please try again.',
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

    try {
      const data = {
        name: formData.name,
        slug: formData.slug,
        image: formData.image || undefined,
        parentId: formData.parentId ? parseInt(formData.parentId) : undefined,
      };

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const url = editingCategory
        ? `${baseUrl}/categories/${editingCategory.id}`
        : `${baseUrl}/categories`;

      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchCategories();
        setIsDialogOpen(false);
        resetForm();
        addToast({
          type: 'success',
          title: 'Success',
          description: `Category ${editingCategory ? 'updated' : 'created'} successfully.`,
        });
      } else {
        const error = await response.json();
        if (response.status === 500 && error.message?.includes('Unique constraint failed')) {
          setIsDialogOpen(false);
          setTimeout(() => {
            addToast({
              type: 'error',
              title: 'Duplicate Slug',
              description: 'A category with this slug already exists. Please choose a different slug.',
            });
          }, 100);
        } else if (response.status === 400 && error.message?.includes('Maximum 8 main categories')) {
          setIsDialogOpen(false);
          setTimeout(() => {
            addToast({
              type: 'warning',
              title: 'Limit Reached',
              description: 'You can only have a maximum of 8 main categories.',
            });
          }, 100);
        } else {
          setIsDialogOpen(false);
          setTimeout(() => {
            addToast({
              type: 'error',
              title: 'Error',
              description: error.message || 'Failed to save category.',
            });
          }, 100);
        }
        resetForm(); // Reset form on error
      }
    } catch (error) {
      console.error('Error saving category:', error);
      setIsDialogOpen(false);
      resetForm(); // Reset form on error
      setTimeout(() => {
        addToast({
          type: 'error',
          title: 'Error',
          description: 'Failed to save category. Please try again.',
        });
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(id);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCategories();
        addToast({
          type: 'success',
          title: 'Success',
          description: 'Category deleted successfully.',
        });
      } else {
        const error = await response.json();
        addToast({
          type: 'error',
          title: 'Error',
          description: error.message || 'Failed to delete category.',
        });
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to delete category. Please try again.',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      image: '',
      parentId: '',
    });
    setEditingCategory(null);
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: editingCategory ? formData.slug : generateSlug(name), // Only auto-generate slug for new categories
    });
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      image: category.image || '',
      parentId: category.parentId?.toString() || '',
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

  const renderCategoryRow = (category: Category, level = 0): React.JSX.Element[] => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const rows: React.JSX.Element[] = [];

    // Add the main row
    rows.push(
      <TableRow key={category.id}>
        <TableCell>
          <div style={{ paddingLeft: `${level * 20}px` }}>
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(category.id)}
                className="mr-2 p-0 h-4 w-4"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
            )}
            {category.name}
          </div>
        </TableCell>
        <TableCell>{category.slug}</TableCell>
        <TableCell>{category.image ? 'Yes' : 'No'}</TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditDialog(category)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDeleting === category.id}
                >
                  {isDeleting === category.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the category &ldquo;{category.name}&rdquo; and all its subcategories.
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
      </TableRow>
    );

    // Add child rows if expanded
    if (hasChildren && isExpanded) {
      category.children!.forEach(child => {
        rows.push(...renderCategoryRow(child, level + 1));
      });
    }

    return rows;
  };  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage your flower categories and subcategories
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
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
              <div>
                <Label htmlFor="image">Image URL (optional)</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="parentId">Parent Category (optional)</Label>
                <select
                  id="parentId"
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full p-2 border rounded"
                  disabled={isSubmitting}
                >
                  <option value="">Select parent category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id.toString()}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
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
                <TableHead>Image</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.flatMap(category => renderCategoryRow(category))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
