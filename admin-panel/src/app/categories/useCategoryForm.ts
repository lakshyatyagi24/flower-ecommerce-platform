'use client';

import { useState } from 'react';
import { adminApi, AdminCategory } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { errorMessage } from '@/lib/error-message';
import { blankForm, categoryToForm, describeSaveError, formToPayload, FormState, generateSlug } from './category-form';

export function useCategoryForm(onSaved: () => Promise<void>) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [formData, setFormData] = useState<FormState>(blankForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const resetForm = () => {
    setFormData(blankForm());
    setEditingCategory(null);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleNameChange = (name: string) =>
    setFormData((prev) => ({ ...prev, name, slug: editingCategory ? prev.slug : generateSlug(name) }));

  const openEditDialog = (category: AdminCategory) => {
    setEditingCategory(category);
    setFormData(categoryToForm(category));
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = formToPayload(formData);
    try {
      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.id, payload);
      } else {
        await adminApi.createCategory(payload);
      }
      await onSaved();
      setIsDialogOpen(false);
      resetForm();
      addToast({
        type: 'success',
        title: 'Success',
        description: `Category ${editingCategory ? 'updated' : 'created'} successfully.`,
      });
    } catch (error) {
      // Keep the dialog open and preserve the admin's input so they can correct
      // the issue and retry, instead of losing everything they typed.
      addToast({ type: 'error', ...describeSaveError(errorMessage(error, 'Failed to save category.')) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isDialogOpen,
    setIsDialogOpen,
    editingCategory,
    formData,
    setField,
    isSubmitting,
    handleNameChange,
    openEditDialog,
    openCreateDialog,
    handleSubmit,
  };
}

export type CategoryFormState = ReturnType<typeof useCategoryForm>;
