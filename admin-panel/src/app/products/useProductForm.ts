"use client";

import { useState } from "react";
import { adminApi, AdminProduct, ApiError, validateImageFile } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { buildProductPayload, emptyForm, ProductForm, productToForm, slugify } from "./product-form";

function saveErrorMessage(err: unknown): string {
  if (err instanceof ApiError || err instanceof Error) return err.message;
  return "Save failed";
}

export function useProductForm(onSaved: () => void) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { addToast } = useToast();

  const reset = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const openCreate = () => {
    reset();
    setIsDialogOpen(true);
  };

  const openEdit = (p: AdminProduct) => {
    setEditing(p);
    setForm(productToForm(p));
    setIsDialogOpen(true);
  };

  const setField = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: editing ? f.slug : slugify(name) }));
  };

  const handleImageFile = async (file: File | null) => {
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      addToast({ type: "error", title: "Invalid image", description: problem });
      return;
    }
    setUploading(true);
    try {
      const { url } = await adminApi.uploadImage(file, "products");
      setField("image", url);
    } catch (e) {
      addToast({ type: "error", title: "Upload failed", description: (e as Error).message });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const payload = buildProductPayload(form);
    if (editing) {
      await adminApi.updateProduct(editing.id, payload);
      addToast({ type: "success", title: "Updated", description: `${payload.name} updated.` });
    } else {
      await adminApi.createProduct(payload);
      addToast({ type: "success", title: "Created", description: `${payload.name} added.` });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await save();
      setIsDialogOpen(false);
      reset();
      onSaved();
    } catch (err) {
      addToast({ type: "error", title: "Error", description: saveErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    isDialogOpen,
    setIsDialogOpen,
    editing,
    form,
    setField,
    submitting,
    uploading,
    openCreate,
    openEdit,
    handleNameChange,
    handleImageFile,
    handleSubmit,
  };
}

export type ProductFormState = ReturnType<typeof useProductForm>;
